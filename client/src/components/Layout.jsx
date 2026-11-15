import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

const NAV = [
  ['/', 'home', 'Accueil'],
  ['/revisions', 'book', 'Révisions'],
  ['/exercices', 'pen', 'Exercices'],
  ['/travaux', 'layers', 'Mes travaux'],
  ['/annales', 'cap', 'Annales du bac'],
  ['/examens', 'clipboard', 'Examens'],
  ['/communaute', 'users', 'Communauté'],
  ['/profil', 'user', 'Profil'],
];
const BAS = [
  ['/', 'home', 'Accueil'],
  ['/revisions', 'book', 'Réviser'],
  ['/exercices', 'pen', 'Exercices'],
  ['/travaux', 'layers', 'Travaux'],
  ['/profil', 'user', 'Profil'],
];

const Marque = () => (
  <Link to="/" className="marque">
    <span className="logo">GD</span>
    <span>
      Grand et
      <br />
      Disciples
    </span>
  </Link>
);

function useEnLigne() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return on;
}

export default function Layout({ children }) {
  const [ouvert, setOuvert] = useState(false);
  const { pathname } = useLocation();
  const enLigne = useEnLigne();
  useEffect(() => setOuvert(false), [pathname]);

  return (
    <div className="app">
      <aside className={`sidebar ${ouvert ? 'ouvert' : ''}`}>
        <Marque />
        <nav aria-label="Navigation principale">
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon name={icon} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {ouvert && <button className="voile" aria-label="Fermer le menu" onClick={() => setOuvert(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" aria-label="Ouvrir le menu" onClick={() => setOuvert(true)}>
            <Icon name="menu" />
          </button>
          <Link to="/" className="marque marque-mini">
            <span className="logo">GD</span> Grand et Disciples
          </Link>
          <span style={{ width: 40 }} />
        </header>
        {!enLigne && <div className="hors-ligne">Hors ligne — tu consultes les pages déjà ouvertes.</div>}
        <main className="contenu">{children}</main>
      </div>

      <nav className="bottomnav" aria-label="Navigation rapide">
        {BAS.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon name={icon} size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
