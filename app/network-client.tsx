"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase";
import {
  Bell, Bookmark, Camera, Check, Heart, Home, LogOut, MessageCircle,
  MoreHorizontal, Search, Send, Share2, Sparkles, UserPlus, Users, Video, X
} from "lucide-react";
import Link from "next/link";

type Community = {
  id: string; slug: string; name: string; description: string; icon: string; is_verified: boolean;
};
type PublicProfile = { id: string; full_name: string | null; avatar_url: string | null };
type Media = { id: string; media_type: "image" | "video" | "audio"; storage_path: string; mime_type: string | null; position: number };
type Post = {
  id: string; author_id: string; community_id: string | null; content: string; created_at: string; visibility: string;
  author?: PublicProfile | null; likes: string[]; comments: CommentItem[]; media: Media[]; shares: number; bookmarked: boolean;
};
type CommentItem = { id: string; author_id: string; content: string; created_at: string; author?: PublicProfile | null };

const supabase = createClient();

function avatarLabel(profile?: PublicProfile | null, email?: string | null) {
  return (profile?.full_name || email || "B").trim().slice(0, 1).toUpperCase();
}

export default function NetworkClient() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaPreview = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : "", [selectedFile]);
  useEffect(() => () => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); }, [mediaPreview]);

  async function load() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      window.location.href = "/auth";
      return;
    }
    setUser(currentUser);

    const [{ data: me }, { data: communitiesData }, { data: postsData }] = await Promise.all([
      supabase.from("social_public_profiles").select("id,full_name,avatar_url").eq("id", currentUser.id).maybeSingle(),
      supabase.from("social_communities").select("id,slug,name,description,icon,is_verified").order("name"),
      supabase.from("social_posts").select("id,author_id,community_id,content,created_at,visibility").order("created_at", { ascending: false }).limit(50),
    ]);

    setProfile(me || null);
    setCommunities(communitiesData || []);

    const rawPosts = postsData || [];
    const authorIds = [...new Set(rawPosts.map((p: any) => p.author_id))];
    const postIds = rawPosts.map((p: any) => p.id);

    const [authorsRes, likesRes, commentsRes, mediaRes, bookmarksRes, sharesRes] = await Promise.all([
      authorIds.length ? supabase.from("social_public_profiles").select("id,full_name,avatar_url").in("id", authorIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_likes").select("post_id,user_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_comments").select("id,post_id,author_id,content,created_at").in("post_id", postIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_media").select("id,post_id,media_type,storage_path,mime_type,position").in("post_id", postIds).order("position") : Promise.resolve({ data: [] as any[] }),
      supabase.from("social_bookmarks").select("post_id").eq("user_id", currentUser.id),
      postIds.length ? supabase.from("social_shares").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
    ]);

    const authorMap = new Map((authorsRes.data || []).map((p: any) => [p.id, p]));
    const commentAuthorIds = [...new Set((commentsRes.data || []).map((c: any) => c.author_id))];
    const { data: commentAuthors } = commentAuthorIds.length
      ? await supabase.from("social_public_profiles").select("id,full_name,avatar_url").in("id", commentAuthorIds)
      : { data: [] as any[] };
    const commentAuthorMap = new Map((commentAuthors || []).map((p: any) => [p.id, p]));
    const likesByPost = new Map<string, string[]>();
    (likesRes.data || []).forEach((x: any) => likesByPost.set(x.post_id, [...(likesByPost.get(x.post_id) || []), x.user_id]));
    const commentsByPost = new Map<string, CommentItem[]>();
    (commentsRes.data || []).forEach((x: any) => commentsByPost.set(x.post_id, [...(commentsByPost.get(x.post_id) || []), { ...x, author: commentAuthorMap.get(x.author_id) || null }]));
    const mediaByPost = new Map<string, Media[]>();
    (mediaRes.data || []).forEach((x: any) => mediaByPost.set(x.post_id, [...(mediaByPost.get(x.post_id) || []), x]));
    const bookmarked = new Set((bookmarksRes.data || []).map((x: any) => x.post_id));
    const sharesByPost = new Map<string, number>();
    (sharesRes.data || []).forEach((x: any) => sharesByPost.set(x.post_id, (sharesByPost.get(x.post_id) || 0) + 1));

    setPosts(rawPosts.map((p: any) => ({
      ...p,
      author: authorMap.get(p.author_id) || null,
      likes: likesByPost.get(p.id) || [],
      comments: commentsByPost.get(p.id) || [],
      media: mediaByPost.get(p.id) || [],
      shares: sharesByPost.get(p.id) || 0,
      bookmarked: bookmarked.has(p.id),
    })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel("bickri-network-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "social_comments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "social_likes" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function publish() {
    if (!user || (!text.trim() && !selectedFile)) return;
    setPublishing(true);
    setNotice("");
    const { data: post, error } = await supabase.from("social_posts").insert({
      author_id: user.id,
      content: text.trim(),
      community_id: selectedCommunity || null,
      visibility: "public",
    }).select("id").single();

    if (error || !post) {
      setNotice(error?.message || "Impossible de publier.");
      setPublishing(false);
      return;
    }

    if (selectedFile) {
      const allowed = selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/");
      const maxBytes = selectedFile.type.startsWith("video/") ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
      if (!allowed || selectedFile.size > maxBytes) {
        await supabase.from("social_posts").delete().eq("id", post.id);
        setNotice("Format non pris en charge ou fichier trop volumineux.");
        setPublishing(false);
        return;
      }
      const mediaType = selectedFile.type.startsWith("video/") ? "video" : "image";
      const path = `${user.id}/${post.id}/${crypto.randomUUID()}-${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("social-media").upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });
      if (upload.error) {
        await supabase.from("social_posts").delete().eq("id", post.id);
        setNotice(upload.error.message);
        setPublishing(false);
        return;
      }
      const mediaInsert = await supabase.from("social_media").insert({
        post_id: post.id, media_type: mediaType, storage_path: path, mime_type: selectedFile.type, position: 0
      });
      if (mediaInsert.error) {
        await supabase.storage.from("social-media").remove([path]);
        await supabase.from("social_posts").delete().eq("id", post.id);
        setNotice(mediaInsert.error.message);
        setPublishing(false);
        return;
      }
    }

    setText("");
    setSelectedFile(null);
    setSelectedCommunity("");
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setPublishing(false);
  }

  async function like(post: Post) {
    if (!user) return;
    const liked = post.likes.includes(user.id);
    const result = liked
      ? await supabase.from("social_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("social_likes").insert({ post_id: post.id, user_id: user.id });
    if (result.error) setNotice(result.error.message); else await load();
  }

  async function toggleBookmark(post: Post) {
    if (!user) return;
    const result = post.bookmarked
      ? await supabase.from("social_bookmarks").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("social_bookmarks").insert({ post_id: post.id, user_id: user.id });
    if (result.error) setNotice(result.error.message); else await load();
  }

  async function addComment(postId: string) {
    if (!user) return;
    const value = comment[postId]?.trim();
    if (!value) return;
    const { error } = await supabase.from("social_comments").insert({ post_id: postId, author_id: user.id, content: value });
    if (error) setNotice(error.message);
    else { setComment({ ...comment, [postId]: "" }); await load(); }
  }

  async function share(post: Post) {
    if (!user) return;
    const url = window.location.origin + "/post/" + post.id;
    try {
      if (navigator.share) await navigator.share({ title: "Bickri Network", text: post.content.slice(0, 100), url });
      else await navigator.clipboard.writeText(url);
      const { error } = await supabase.from("social_shares").insert({ post_id: post.id, user_id: user.id });
      if (error) setNotice(error.message);
      else { setNotice("Publication partagée."); await load(); }
    } catch {
      // User cancelled the native share sheet.
    }
  }

  async function joinCommunity(communityId: string) {
    if (!user) return;
    const { error } = await supabase.from("social_community_members").upsert({ community_id: communityId, user_id: user.id });
    setNotice(error ? error.message : "Vous avez rejoint la communauté.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  function selectFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">BICKRI <span>NETWORK</span></Link>
        <div className="searchbox"><Search size={17}/><input placeholder="Rechercher sur Bickri Network"/></div>
        <div className="actions">
          <button className="iconbtn" aria-label="Notifications"><Bell size={19}/></button>
          <button className="iconbtn" onClick={logout} aria-label="Se déconnecter"><LogOut size={19}/></button>
          <Link href="/profile" className="avatar mini" title={user?.email}>{avatarLabel(profile, user?.email)}</Link>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav className="nav">
            <a className="active" href="#accueil"><Home size={18}/>Accueil</a>
            <a href="#decouvrir"><Sparkles size={18}/>Découvrir</a>
            <a href="#communautes"><Users size={18}/>Communautés</a>
            <a href="#videos"><Video size={18}/>Vidéos</a>
            <a href="#messages"><MessageCircle size={18}/>Messages</a>
            <a href="#enregistres"><Bookmark size={18}/>Enregistrés</a>
          </nav>
        </aside>

        <section className="feed" id="accueil">
          <div className="welcome">
            <div><span className="eyebrow">BICKRI NETWORK</span><h1>Votre communauté. Vos idées. Votre Afrique.</h1><p>Vous êtes connecté avec votre vrai compte. Toutes les publications affichées proviennent de la base de données.</p></div>
            <div className="welcome-icon">B</div>
          </div>

          {notice && <div className="notice global-notice">{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}

          <div className="composer">
            <div className="composer-head">
              <div className="avatar">{avatarLabel(profile, user?.email)}</div>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Quoi de neuf ?" />
            </div>
            {selectedFile && <div className="media-preview">{selectedFile.type.startsWith("video/") ? <video src={mediaPreview} controls/> : <img src={mediaPreview} alt="Aperçu"/>}<button onClick={() => {setSelectedFile(null); if(fileRef.current) fileRef.current.value=""}}><X size={17}/></button></div>}
            <div className="composer-row">
              <div className="composer-tools">
                <button type="button" onClick={() => fileRef.current?.click()}><Camera size={17}/>Photo / vidéo</button>
                <span><Sparkles size={17}/>Sondage</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={selectFile}/>
              <select value={selectedCommunity} onChange={e => setSelectedCommunity(e.target.value)}>
                <option value="">Aucune communauté</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <button className="primary" disabled={publishing || (!text.trim() && !selectedFile)} onClick={publish}>{publishing ? "Publication…" : "Publier"}</button>
            </div>
          </div>

          {loading ? <div className="loading">Chargement des données réelles…</div> :
            posts.length === 0 ? <div className="empty"><Sparkles size={28}/><h3>Aucune publication</h3><p>Il n'y a actuellement aucune publication. Soyez le premier à publier.</p></div> :
            posts.map(post => {
              const liked = post.likes.includes(user?.id);
              return <article className="post" key={post.id}>
                <div className="posthead">
                  <div className="avatar">{avatarLabel(post.author)}</div>
                  <div className="post-author"><h3>{post.author?.full_name || "Membre Bickri"}</h3><span className="muted">{new Date(post.created_at).toLocaleString("fr-FR", { dateStyle:"medium", timeStyle:"short" })}</span></div>
                  <button className="more" aria-label="Plus"><MoreHorizontal size={19}/></button>
                </div>
                {post.content && <p className="post-content">{post.content}</p>}
                {post.media.length > 0 && <div className="post-media">{post.media.map(m => {
                  const { data } = supabase.storage.from("social-media").getPublicUrl(m.storage_path);
                  return m.media_type === "video"
                    ? <video key={m.id} src={data.publicUrl} controls preload="metadata"/>
                    : <img key={m.id} src={data.publicUrl} alt="Publication Bickri Network" loading="lazy"/>;
                })}</div>}
                <div className="post-actions">
                  <button className={liked ? "liked" : ""} onClick={() => like(post)}><Heart size={18} fill={liked ? "currentColor" : "none"}/>{post.likes.length}</button>
                  <button><MessageCircle size={18}/>{post.comments.length}</button>
                  <button onClick={() => share(post)}><Share2 size={18}/>{post.shares}</button>
                  <button className={post.bookmarked ? "saved" : ""} onClick={() => toggleBookmark(post)}><Bookmark size={18} fill={post.bookmarked ? "currentColor" : "none"}/></button>
                </div>
                {post.comments.length > 0 && <div className="comments">{post.comments.map(c => <div className="comment" key={c.id}><div className="avatar tiny">{avatarLabel(c.author)}</div><div><strong>{c.author?.full_name || "Membre Bickri"}</strong><p>{c.content}</p></div></div>)}</div>}
                <div className="comment-box"><input value={comment[post.id] || ""} onChange={e => setComment({ ...comment, [post.id]: e.target.value })} onKeyDown={e => { if (e.key === "Enter") addComment(post.id); }} placeholder="Écrire un commentaire…"/><button onClick={() => addComment(post.id)}><Send size={17}/></button></div>
              </article>;
            })}
        </section>

        <aside className="rightbar" id="communautes">
          <h2 className="section-title">Communautés</h2>
          {communities.map(c => <div className="community" key={c.id}>
            <div className="community-icon">{c.icon}</div><h3>{c.name} {c.is_verified && <span className="verified"><Check size={10}/></span>}</h3>
            <div className="muted">{c.description}</div>
            <button className="primary cta" onClick={() => joinCommunity(c.id)}><UserPlus size={15}/>Rejoindre</button>
          </div>)}
        </aside>
      </div>

      <nav className="mobile-nav">
        <a href="#accueil"><Home size={20}/>Accueil</a><a href="#decouvrir"><Sparkles size={20}/>Découvrir</a><a href="#communautes"><Users size={20}/>Communautés</a><a href="#messages"><MessageCircle size={20}/>Messages</a><button onClick={logout}><LogOut size={20}/>Quitter</button>
      </nav>
    </main>
  );
}
