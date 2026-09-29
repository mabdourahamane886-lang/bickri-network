const communities = [
  { icon: "💼", name: "Bickri Service Agency", text: "IA, technologie, business, marketing et entrepreneuriat." },
  { icon: "🇳🇪", name: "Le Niger et ses Merveilles", text: "Culture, patrimoine, tourisme et découvertes du Niger." },
  { icon: "📖", name: "Nouroul Foua'ad", text: "Coran, Hadith, Tajwid, Fiqh et apprentissage." },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">BICKRI <span>NETWORK</span></div>
        <div className="actions">
          <button className="iconbtn" aria-label="Recherche">⌕</button>
          <button className="iconbtn" aria-label="Notifications">🔔</button>
          <button className="iconbtn" aria-label="Profil">👤</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav className="nav">
            <a className="active" href="#">🏠 Accueil</a>
            <a href="#">🔥 Découvrir</a>
            <a href="#">👥 Communautés</a>
            <a href="#">🎬 Vidéos</a>
            <a href="#">💬 Messages</a>
            <a href="#">🔖 Enregistrés</a>
          </nav>
        </aside>

        <section>
          <div className="composer">
            <input placeholder="Quoi de neuf dans votre communauté ?" />
            <div className="composer-row">
              <span>📷 Photo &nbsp; 🎥 Vidéo &nbsp; 📊 Sondage</span>
              <button className="primary">Publier</button>
            </div>
          </div>

          <h2 className="section-title">🔥 À découvrir</h2>

          <article className="post">
            <div className="posthead">
              <div className="avatar">B</div>
              <div><h3>Bickri Network</h3><span className="muted">Aujourd'hui · Public</span></div>
            </div>
            <p>Bienvenue sur Bickri Network — un espace pour connecter les talents, les cultures et les savoirs africains.</p>
            <div className="tags"><span className="tag">#BickriNetwork</span><span className="tag">#Niger</span><span className="tag">#Afrique</span></div>
          </article>

          <article className="post">
            <div className="posthead">
              <div className="avatar">🇳🇪</div>
              <div><h3>Le Niger et ses Merveilles</h3><span className="muted">Communauté · Niger</span></div>
            </div>
            <p>Découvrez les régions, les traditions, les paysages et les histoires qui font la richesse du Niger.</p>
          </article>
        </section>

        <aside className="rightbar">
          <h2 className="section-title">Communautés</h2>
          {communities.map((community) => (
            <div className="community" key={community.name}>
              <h3>{community.icon} {community.name}</h3>
              <div className="muted">{community.text}</div>
              <button className="primary cta">Rejoindre</button>
            </div>
          ))}
        </aside>
      </div>

      <nav className="mobile-nav">
        <a href="#"><strong>🏠</strong>Accueil</a>
        <a href="#"><strong>🔥</strong>Découvrir</a>
        <a href="#"><strong>➕</strong>Publier</a>
        <a href="#"><strong>💬</strong>Messages</a>
        <a href="#"><strong>👤</strong>Profil</a>
      </nav>
    </main>
  );
}
