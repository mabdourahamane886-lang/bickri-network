"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { Bell, Bookmark, Camera, Heart, Home, LogIn, MessageCircle, MoreHorizontal, Search, Send, Share2, Sparkles, Users, Video } from "lucide-react";
import Link from "next/link";

type Community={id:string;slug:string;name:string;description:string;icon:string;is_verified:boolean};
type Post={id:string;author_id:string;community_id:string|null;content:string;created_at:string;profiles?:{full_name:string|null;avatar_url:string|null}|null;social_likes?:{user_id:string}[];social_comments?:{id:string}[]};

const supabase=createClient();

export default function HomePage(){
  const [user,setUser]=useState<any>(null),[profile,setProfile]=useState<any>(null),[communities,setCommunities]=useState<Community[]>([]),[posts,setPosts]=useState<Post[]>([]);
  const [text,setText]=useState(""),[selectedCommunity,setSelectedCommunity]=useState(""),[loading,setLoading]=useState(true),[publishing,setPublishing]=useState(false),[comment,setComment]=useState<Record<string,string>>({});

  async function load(){
    const {data:{user}}=await supabase.auth.getUser(); setUser(user);
    if(user){const {data:p}=await supabase.from("profiles").select("full_name,avatar_url").eq("id",user.id).maybeSingle();setProfile(p);}
    const {data:c}=await supabase.from("social_communities").select("*").order("name");setCommunities(c||[]);
    const {data}=await supabase.from("social_posts").select("*,profiles!social_posts_author_id_fkey(full_name,avatar_url),social_likes(user_id),social_comments(id)").order("created_at",{ascending:false}).limit(30);
    setPosts((data as Post[])||[]);setLoading(false);
  }
  useEffect(()=>{load();const {data}=supabase.auth.onAuthStateChange(()=>load());return()=>data.subscription.unsubscribe()},[]);

  async function publish(){
    if(!user){window.location.href="/auth";return} if(!text.trim())return; setPublishing(true);
    const {error}=await supabase.from("social_posts").insert({author_id:user.id,content:text.trim(),community_id:selectedCommunity||null,visibility:"public"});
    if(error)alert(error.message);else{setText("");setSelectedCommunity("");await load()} setPublishing(false);
  }
  async function like(post:Post){
    if(!user){window.location.href="/auth";return} const liked=post.social_likes?.some(x=>x.user_id===user.id);
    if(liked)await supabase.from("social_likes").delete().eq("post_id",post.id).eq("user_id",user.id);else await supabase.from("social_likes").insert({post_id:post.id,user_id:user.id});await load();
  }
  async function addComment(postId:string){
    if(!user){window.location.href="/auth";return}const value=comment[postId]?.trim();if(!value)return;
    const {error}=await supabase.from("social_comments").insert({post_id:postId,author_id:user.id,content:value});
    if(error)alert(error.message);else{setComment({...comment,[postId]:""});await load()}
  }

  return <main className="shell">
    <header className="topbar"><Link href="/" className="brand">BICKRI <span>NETWORK</span></Link><div className="searchbox"><Search size={17}/><input placeholder="Rechercher sur Bickri Network"/></div><div className="actions"><button className="iconbtn"><Bell size={19}/></button><Link className="iconbtn" href="/auth">{user?<Users size={19}/>:<LogIn size={19}/>}</Link>{user&&<button className="avatar mini">{(profile?.full_name||user.email||"B").slice(0,1).toUpperCase()}</button>}</div></header>
    <div className="layout">
      <aside className="sidebar"><nav className="nav"><a className="active" href="#accueil"><Home size={18}/>Accueil</a><a href="#decouvrir"><Sparkles size={18}/>Découvrir</a><a href="#communautes"><Users size={18}/>Communautés</a><a href="#videos"><Video size={18}/>Vidéos</a><a href="#messages"><MessageCircle size={18}/>Messages</a><a href="#enregistres"><Bookmark size={18}/>Enregistrés</a></nav></aside>
      <section className="feed" id="accueil">
        <div className="welcome"><div><span className="eyebrow">BICKRI NETWORK</span><h1>Votre communauté. Vos idées. Votre Afrique.</h1><p>Publiez, échangez et découvrez des personnes et des communautés qui vous intéressent.</p></div><div className="welcome-icon">B</div></div>
        <div className="composer"><div className="composer-head"><div className="avatar">{user?(profile?.full_name||user.email||"B").slice(0,1).toUpperCase():"B"}</div><input value={text} onChange={e=>setText(e.target.value)} placeholder={user?"Quoi de neuf ?":"Connectez-vous pour publier..."}/></div><div className="composer-row"><div className="composer-tools"><span><Camera size={17}/>Photo</span><span><Video size={17}/>Vidéo</span><span><Sparkles size={17}/>Sondage</span></div><select value={selectedCommunity} onChange={e=>setSelectedCommunity(e.target.value)}><option value="">Aucune communauté</option>{communities.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select><button className="primary" disabled={publishing} onClick={publish}>{publishing?"Publication…":"Publier"}</button></div></div>
        {loading?<div className="loading">Chargement du fil…</div>:posts.length===0?<div className="empty"><Sparkles size={28}/><h3>Votre fil commence ici</h3><p>Publiez la première actualité de Bickri Network.</p></div>:posts.map(post=>{const liked=!!post.social_likes?.some(x=>x.user_id===user?.id),author=post.profiles?.full_name||"Membre Bickri";return <article className="post" key={post.id}><div className="posthead"><div className="avatar">{author.slice(0,1).toUpperCase()}</div><div className="post-author"><h3>{author}</h3><span className="muted">{new Date(post.created_at).toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"})}</span></div><button className="more"><MoreHorizontal size={19}/></button></div><p className="post-content">{post.content}</p><div className="post-actions"><button className={liked?"liked":""} onClick={()=>like(post)}><Heart size={18} fill={liked?"currentColor":"none"}/>{post.social_likes?.length||0}</button><button><MessageCircle size={18}/>{post.social_comments?.length||0}</button><button><Share2 size={18}/>Partager</button><button><Bookmark size={18}/></button></div><div className="comment-box"><input value={comment[post.id]||""} onChange={e=>setComment({...comment,[post.id]:e.target.value})} placeholder="Écrire un commentaire…"/><button onClick={()=>addComment(post.id)}><Send size={17}/></button></div></article>})}
      </section>
      <aside className="rightbar" id="communautes"><h2 className="section-title">Communautés</h2>{communities.map(c=><div className="community" key={c.id}><div className="community-icon">{c.icon}</div><h3>{c.name} {c.is_verified&&<span className="verified">✓</span>}</h3><div className="muted">{c.description}</div><button className="primary cta" onClick={async()=>{if(!user){window.location.href="/auth";return}const {error}=await supabase.from("social_community_members").upsert({community_id:c.id,user_id:user.id});if(error)alert(error.message);else alert("Vous avez rejoint cette communauté.")}}>Rejoindre</button></div>)}</aside>
    </div>
    <nav className="mobile-nav"><a href="#accueil"><Home size={20}/>Accueil</a><a href="#decouvrir"><Sparkles size={20}/>Découvrir</a><a href="#communautes"><Users size={20}/>Communautés</a><a href="#messages"><MessageCircle size={20}/>Messages</a><Link href="/auth"><Users size={20}/>Profil</Link></nav>
  </main>
}
