"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Camera, LogOut, Save, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

const supabase = createClient();

export default function ProfileClient() {
  const [user,setUser]=useState<any>(null);
  const [name,setName]=useState("");
  const [avatar,setAvatar]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/auth";return;}
    setUser(user);
    const {data}=await supabase.from("profiles").select("full_name,avatar_url").eq("id",user.id).single();
    setName(data?.full_name||""); setAvatar(data?.avatar_url||"");
  })()},[]);

  async function save(){
    if(!user)return;
    setSaving(true); setMessage("");
    const {error}=await supabase.from("profiles").update({full_name:name.trim(),avatar_url:avatar||null,updated_at:new Date().toISOString()}).eq("id",user.id);
    setMessage(error?error.message:"Profil enregistré.");
    setSaving(false);
  }

  async function upload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file||!user)return;
    if(!file.type.startsWith("image/")){setMessage("Choisissez une image.");return;}
    const path=user.id+"/profile/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const {error}=await supabase.storage.from("social-media").upload(path,file,{contentType:file.type,upsert:false});
    if(error){setMessage(error.message);return;}
    const {data}=supabase.storage.from("social-media").getPublicUrl(path);
    setAvatar(data.publicUrl);
  }

  async function logout(){await supabase.auth.signOut();window.location.href="/auth";}

  return <main className="auth-page"><section className="auth-card">
    <Link href="/" className="back"><ArrowLeft size={17}/> Retour au réseau</Link>
    <div className="profile-large-avatar">{avatar?<img src={avatar} alt="Photo de profil"/>:<User size={38}/>}</div>
    <h1>Mon profil</h1>
    <p className="muted">{user?.email}</p>
    <label className="upload-avatar"><Camera size={17}/> Choisir une photo<input type="file" accept="image/*" hidden onChange={upload}/></label>
    <div className="profile-form"><label>Nom complet<input value={name} onChange={e=>setName(e.target.value)} placeholder="Votre nom complet"/></label></div>
    <button className="primary auth-submit" disabled={saving} onClick={save}><Save size={17}/>{saving?"Enregistrement…":"Enregistrer"}</button>
    {message&&<div className="notice">{message}</div>}
    <button className="switch" onClick={logout}><LogOut size={16}/> Se déconnecter</button>
  </section></main>
}
