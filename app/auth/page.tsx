"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase";
import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");

  async function submit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const supabase=createClient();
      if(mode==="signup"){
        const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        setMessage("Compte créé. Vérifiez votre e-mail si la confirmation est activée.");
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.href="/";
      }
    } catch(err){setMessage(err instanceof Error?err.message:"Une erreur est survenue.");}
    finally{setLoading(false);}
  }

  return <main className="auth-page"><div className="auth-card">
    <Link href="/" className="back"><ArrowLeft size={17}/> Retour</Link>
    <div className="auth-brand">BICKRI <span>NETWORK</span></div>
    <h1>{mode==="login"?"Bienvenue sur Bickri Network":"Créer votre compte"}</h1>
    <p className="muted">{mode==="login"?"Connectez-vous à votre communauté.":"Rejoignez une communauté de talents, de cultures et de savoirs."}</p>
    <form onSubmit={submit}>
      {mode==="signup"&&<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nom complet"/>}
      <label><Mail size={17}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Adresse e-mail"/></label>
      <label><LockKeyhole size={17}/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe (8 caractères minimum)"/></label>
      <button className="primary auth-submit" disabled={loading}>{loading?<Loader2 className="spin" size={18}/>:null}{mode==="login"?"Se connecter":"Créer mon compte"}</button>
    </form>
    {message&&<div className="notice">{message}</div>}
    <button className="switch" onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("")}}>{mode==="login"?"Pas encore de compte ? Créer un compte":"Déjà inscrit ? Se connecter"}</button>
  </div></main>
}
