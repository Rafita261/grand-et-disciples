import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi, Charge, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';

export default function Exercices() {
  const { estEnseignant } = useAuth();
  const [f, setF] = useState({ q: '', matiere: '', niveau: '' });
  const [params, setParams] = useState('');
  // On attend la fin de la frappe avant d'interroger le serveur.
  useEffect(() => {
    const t = setTimeout(() => setParams(new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()), 350);
    return () => clearTimeout(t);
  }, [f]);
  const q = useApi(`/exercises?${params}`);
  const attente = useApi('/exercises?propositions=1');
  const chapitres = useApi('/chapters');
  const matieres = [...new Set((chapitres.data || []).map((c) => c.matiere))];
  const agir = (path, method) => api(path, { method }).then(() => { attente.reload(); q.reload(); }).catch((e) => alert(e.message));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <header className="row between">
        <h1>Exercices</h1>
        <Link className="btn" to="/exercices/nouveau"><Icon name="plus" size={18} /> Proposer un exercice</Link>
      </header>
      <div className="filtres">
        <input type="search" placeholder="Rechercher un exercice…" value={f.q} onChange={set('q')} aria-label="Rechercher" />
        <select value={f.matiere} onChange={set('matiere')} aria-label="Matière">
          <option value="">Toutes les matières</option>
          {matieres.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={f.niveau} onChange={set('niveau')} aria-label="Niveau">
          <option value="">Tous les niveaux</option>
          {['Facile', 'Intermédiaire', 'Difficile'].map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      {attente.data?.length > 0 && (
        <section className="card stack">
          <h2>Propositions en attente ({attente.data.length})</h2>
          <ul className="liste">
            {attente.data.map((e) => (
              <li key={e._id} className="item">
                <Link to={`/exercices/${e._id}`} className="grow" style={{ color: 'inherit' }}>
                  <strong>{e.titre}</strong>
                  <p className="muted small">{e.chapter?.matiere} · {e.chapter?.titre} · proposé par {e.auteur?.nom || 'un membre'}</p>
                </Link>
                <span className="fin">
                  {estEnseignant && <button className="btn btn-sm btn-primary" onClick={() => agir(`/exercises/${e._id}/publier`, 'POST')}>Publier</button>}
                  <button className="btn btn-sm btn-plain" onClick={() => window.confirm(`Supprimer « ${e.titre} » ?`) && agir(`/exercises/${e._id}`, 'DELETE')}>{estEnseignant ? 'Refuser' : 'Retirer'}</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Charge q={q}>
        {(liste) =>
          liste.length ? (
            <ul className="liste">
              {liste.map((e) => (
                <li key={e._id}>
                  <Link className="item" to={`/exercices/${e._id}`}>
                    <span className={`pastille ${e.resolu ? 'ok' : ''}`}><Icon name={e.resolu ? 'check' : 'pen'} /></span>
                    <div className="grow">
                      <strong>{e.titre}</strong>
                      <p className="muted small">{e.chapter?.matiere} · {e.chapter?.titre}</p>
                    </div>
                    <span className="fin"><span className="chip chip-accent">{e.niveau}</span><span className="chip"><Icon name="clock" size={13} /> {e.duree} min</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vide>Aucun exercice ne correspond à ta recherche.</Vide>
          )
        }
      </Charge>
    </>
  );
}
