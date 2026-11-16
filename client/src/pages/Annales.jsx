import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, duree } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, Charge, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export function useDemarrer() {
  const nav = useNavigate();
  return async (annaleId) => {
    try {
      const a = await api(`/annales/${annaleId}/attempts`, { method: 'POST' });
      nav(`/simulation/${a._id}`);
    } catch (e) {
      alert(e.message);
    }
  };
}

export default function Annales() {
  const { user, estEnseignant } = useAuth();
  const chapitres = useApi('/chapters');
  const matieres = [...new Set((chapitres.data || []).map((c) => c.matiere))];
  const demarrer = useDemarrer();
  const [f, setF] = useState({ matiere: '', serie: user.serie || '', annee: '' });
  const q = useApi(`/annales?${new URLSearchParams(Object.entries(f).filter(([, v]) => v))}`);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <header className="row between">
        <div>
          <h1>Annales du bac</h1>
          <p className="serif-it">S’entraîner en conditions réelles.</p>
        </div>
        {estEnseignant && <Link className="btn" to="/annales/nouveau"><Icon name="plus" size={18} /> Ajouter un sujet</Link>}
      </header>
      <div className="card filtres">
        <label className="champ">Matière
          <select value={f.matiere} onChange={set('matiere')}>
            <option value="">Toutes</option>
            {matieres.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="champ">Série
          <select value={f.serie} onChange={set('serie')}>
            <option value="">Toutes</option>
            {['A', 'C', 'D', 'L', 'S', 'OSE'].map((s) => <option key={s} value={s}>Série {s}</option>)}
          </select>
        </label>
        <label className="champ">Année
          <select value={f.annee} onChange={set('annee')}>
            <option value="">Toutes</option>
            {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <Charge q={q}>
        {(liste) =>
          liste.length ? (
            <div className="grid">
              {liste.map((a) => (
                <article key={a._id} className="card stack">
                  <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                    <span className="pastille"><Icon name="clipboard" /></span>
                    <div>
                      <h3>{a.titre}</h3>
                      <p className="muted small">{a.type} · Série {a.serie}{a.annee ? ` · ${a.annee}` : ''}</p>
                      <p className="muted small">{duree(a.dureeMin)} · {a.nbExercices} exercices · sur {a.total}</p>
                    </div>
                  </div>
                  <div className="row">
                    <Link className="btn btn-sm" to={`/annales/${a._id}`}><Icon name="book" size={16} /> Consulter le sujet</Link>
                    <Link className="btn btn-sm btn-plain" to={`/annales/${a._id}?corrige=1`}><Icon name="check" size={16} /> Corrigé</Link>
                    <button className="btn btn-sm btn-primary" onClick={() => demarrer(a._id)}>Commencer</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Vide>Aucun sujet pour ces critères.</Vide>
          )
        }
      </Charge>

      <section className="card card-accent stack">
        <h2 className="row"><Icon name="cap" /> Prêt pour une simulation ?</h2>
        <p className="small">Chronomètre, réponses sauvegardées à chaque étape, bilan détaillé par thème. Tu peux fermer l’application et reprendre : le temps continue de s’écouler comme le jour de l’examen.</p>
        <Link className="btn" style={{ justifySelf: 'start' }} to="/examens">Voir mes examens</Link>
      </section>
    </>
  );
}
