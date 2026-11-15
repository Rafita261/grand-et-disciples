import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, Charge, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';

export default function NouvelExercice() {
  const nav = useNavigate();
  const q = useApi('/chapters');
  const [f, setF] = useState({ chapter: '', titre: '', niveau: 'Intermédiaire', duree: 15, enonce: '', indice: '', correction: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const r = await api('/exercises', { method: 'POST', body: f });
      nav(`/exercices/${r._id}`);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <>
      <Retour to="/exercices">Exercices</Retour>
      <h1>Proposer un exercice</h1>
      <Charge q={q}>
        {(chapitres) => (
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
            <label className="champ">Titre<input type="text" value={f.titre} onChange={set('titre')} required maxLength={140} /></label>
            <label className="champ">Énoncé (formules entre $ $)<textarea value={f.enonce} onChange={set('enonce')} required /></label>
            {f.enonce && <div className="note"><RichText text={f.enonce} /></div>}
            <label className="champ">Indice (facultatif)<textarea value={f.indice} onChange={set('indice')} style={{ minHeight: 60 }} /></label>
            <label className="champ">Correction<textarea value={f.correction} onChange={set('correction')} /></label>
            {err && <p className="note note-err" role="alert">{err}</p>}
            <button className="btn btn-primary" style={{ justifySelf: 'start' }}>Publier l’exercice</button>
          </form>
        )}
      </Charge>
    </>
  );
}
