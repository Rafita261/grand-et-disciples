import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icon from './Icon.jsx';

/** Charge une ressource de l'API. `path` nul = pas d'appel. */
export function useApi(path) {
  const [s, setS] = useState({ data: null, error: null, loading: Boolean(path) });
  const reload = useCallback(() => {
    if (!path) return;
    let on = true;
    setS((p) => ({ ...p, loading: true }));
    api(path)
      .then((data) => on && setS({ data, error: null, loading: false }))
      .catch((e) => on && setS({ data: null, error: e.message, loading: false }));
    return () => {
      on = false;
    };
  }, [path]);
  useEffect(() => reload(), [reload]);
  return { ...s, reload };
}

/** Affiche l'état de chargement / d'erreur, puis le contenu. */
export function Charge({ q, children }) {
  if (q.error) return <p className="note note-err">{q.error}</p>;
  if (!q.data) return <p className="muted pad">Chargement…</p>;
  return children(q.data);
}

export const Bar = ({ pct, tone = 'green' }) => (
  <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
    <span className={tone} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

export const Avatar = ({ nom = '?', size = 34 }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
    {nom.replace(/^Prof\.\s*/, '').charAt(0).toUpperCase()}
  </span>
);

export const BadgeRole = ({ user }) => (user?.role && user.role !== 'eleve' ? <span className="chip chip-green">Enseignant</span> : null);

export const Retour = ({ to, children }) => (
  <Link to={to} className="retour">
    <Icon name="back" size={16} /> {children}
  </Link>
);

export const Vide = ({ children }) => <p className="vide">{children}</p>;

export const ICONE_MATIERE = { Mathématiques: '∫', 'Physique-Chimie': '⚗', Philosophie: '🏛' };
