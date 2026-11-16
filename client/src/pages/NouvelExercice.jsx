import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, Charge, Retour, Vide } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import ImportIA from '../components/ImportIA.jsx';

const ajouter = (ancien, texte) => (ancien.trim() ? `${ancien.trimEnd()}\n\n${texte}` : texte);

export default function NouvelExercice() {
  const nav = useNavigate();
  const { estEnseignant } = useAuth();
  const q = useApi('/chapters');
  const ia = useApi('/ai/status');
  const iaOn = Boolean(ia.data?.enabled);
  const [f, setF] = useState({ chapter: '', titre: '', niveau: 'Intermédiaire', duree: 15, enonce: '', indice: '', correction: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const importer = (k) => (texte) => setF((p) => ({ ...p, [k]: ajouter(p[k], texte) }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api('/exercises', { method: 'POST', body: f });
      nav(`/exercices/${r._id}`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Retour to="/exercices">Exercices</Retour>
      <h1>Proposer un exercice</h1>
      {!estEnseignant && <p className="note">Ton exercice sera visible par tous après validation par un enseignant. En attendant, tu le retrouves dans « Propositions en attente ».</p>}
      <Charge q={q}>
        {(chapitres) =>
          chapitres.length ? (
            <form className="card stack" onSubmit={submit}>
              <div className="filtres">
                <label className="champ">Chapitre
                  <select value={f.chapter} onChange={set('chapter')} required>
                    <option value="">Choisir…</option>
                    {chapitres.map((c) => <option key={c._id} value={c._id}>{c.matiere} — {c.titre}</option>)}
                  </select>
                </label>
                <label className="champ">Niveau
                  <select value={f.niveau} onChange={set('niveau')}>{['Facile', 'Intermédiaire', 'Difficile'].map((n) => <option key={n}>{n}</option>)}</select>
                </label>
                <label className="champ">Durée (min)<input type="number" min="1" max="240" value={f.duree} onChange={set('duree')} /></label>
              </div>
              {estEnseignant && <p className="small muted">Le chapitre n’existe pas encore ? <Link to="/revisions/nouveau">Créer un chapitre</Link></p>}
              <label className="champ">Titre<input type="text" value={f.titre} onChange={set('titre')} required maxLength={140} /></label>

              <div className="stack" style={{ gap: 6 }}>
                <div className="row between">
                  <label className="champ" htmlFor="enonce">Énoncé (formules entre $ $)</label>
                  <ImportIA actif={iaOn} onTexte={importer('enonce')} />
                </div>
                <textarea id="enonce" value={f.enonce} onChange={set('enonce')} required style={{ minHeight: 150 }} />
                {f.enonce && <div className="note"><RichText text={f.enonce} /></div>}
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <div className="row between">
                  <label className="champ" htmlFor="indice">Indice (facultatif)</label>
                  <ImportIA actif={iaOn} onTexte={importer('indice')} />
                </div>
                <textarea id="indice" value={f.indice} onChange={set('indice')} style={{ minHeight: 60 }} />
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <div className="row between">
                  <label className="champ" htmlFor="correction">Correction</label>
                  <ImportIA actif={iaOn} onTexte={importer('correction')} />
                </div>
                <textarea id="correction" value={f.correction} onChange={set('correction')} style={{ minHeight: 150 }} />
                {f.correction && <div className="note"><RichText text={f.correction} /></div>}
              </div>

              <p className="muted small">Une photo ou un PDF est lu par l’IA et converti en LaTeX : relis toujours le résultat avant de publier.</p>
              {err && <p className="note note-err" role="alert">{err}</p>}
              <button className="btn btn-primary" style={{ justifySelf: 'start' }} disabled={busy}>{estEnseignant ? 'Publier l’exercice' : 'Envoyer ma proposition'}</button>
            </form>
          ) : (
            <Vide>
              Aucun chapitre n’existe encore : un exercice doit être rattaché à un chapitre.{' '}
              {estEnseignant ? <Link to="/revisions/nouveau">Créer le premier chapitre</Link> : 'Demande à un enseignant d’en créer un.'}
            </Vide>
          )
        }
      </Charge>
    </>
  );
}
