import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import ImportIA from '../components/ImportIA.jsx';
import Icon from '../components/Icon.jsx';

const EXO = { titre: '', theme: '', points: 5, enonce: '', corrige: '' };
const VIDE = { matiere: '', serie: 'C', annee: '', titre: '', type: "Sujet d'entraînement", dureeMin: 180, exercices: [{ ...EXO }] };
const ajouter = (ancien, texte) => (ancien.trim() ? `${ancien.trimEnd()}\n\n${texte}` : texte);

/** Création (/annales/nouveau) ou modification (/annales/:id/modifier) d'un sujet d'examen — enseignants. */
export default function SujetForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const chapitres = useApi('/chapters');
  const ia = useApi('/ai/status');
  const iaOn = Boolean(ia.data?.enabled);
  const [f, setF] = useState(id ? null : VIDE);
  const [ouvert, setOuvert] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api(`/annales/${id}?corrige=1`).then((a) => setF({ ...VIDE, ...a, annee: a.annee || '' })).catch((e) => setErr(e.message));
  }, [id]);

  if (!f) return err ? <p className="note note-err">{err}</p> : <p className="muted pad">Chargement…</p>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setExo = (i, patch) => setF((p) => ({ ...p, exercices: p.exercices.map((x, k) => (k === i ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)) }));
  const total = f.exercices.reduce((s, e) => s + (Number(e.points) || 0), 0);
  const matieres = [...new Set((chapitres.data || []).map((c) => c.matiere))];

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api(id ? `/annales/${id}` : '/annales', { method: id ? 'PUT' : 'POST', body: f });
      nav(`/annales/${r._id}?corrige=1`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };
  const supprimer = async () => {
    if (!window.confirm(`Supprimer le sujet « ${f.titre} » ?`)) return;
    try {
      await api(`/annales/${id}`, { method: 'DELETE' });
      nav('/annales');
    } catch (e2) {
      setErr(e2.message);
    }
  };
  const retirer = (i) => {
    if (!window.confirm(`Retirer l'exercice ${i + 1} ?`)) return;
    setF({ ...f, exercices: f.exercices.filter((_, k) => k !== i) });
    setOuvert(Math.max(0, i - 1));
  };

  return (
    <>
      <Retour to={id ? `/annales/${id}` : '/annales'}>Annales du bac</Retour>
      <h1>{id ? 'Modifier le sujet' : 'Nouveau sujet d’examen'}</h1>
      <form className="stack" onSubmit={submit}>
        <section className="card stack">
          <label className="champ">Titre du sujet<input type="text" value={f.titre} onChange={set('titre')} required maxLength={140} placeholder="Baccalauréat 2025 · Mathématiques · Série C" /></label>
          <div className="filtres">
            <label className="champ">Matière
              <input type="text" list="matieres-sujet" value={f.matiere} onChange={set('matiere')} required maxLength={60} />
              <datalist id="matieres-sujet">{matieres.map((m) => <option key={m} value={m} />)}</datalist>
            </label>
            <label className="champ">Série
              <select value={f.serie} onChange={set('serie')}>{['A', 'C', 'D', 'L', 'S', 'OSE'].map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="champ">Année (facultatif)<input type="number" min="1990" max="2100" value={f.annee} onChange={set('annee')} /></label>
            <label className="champ">Durée (minutes)<input type="number" min="5" max="600" value={f.dureeMin} onChange={set('dureeMin')} required /></label>
            <label className="champ">Type
              <select value={f.type} onChange={set('type')}>{["Sujet d'entraînement", 'Sujet officiel', 'Bac blanc', 'Devoir surveillé'].map((t) => <option key={t}>{t}</option>)}</select>
            </label>
          </div>
        </section>

        {f.exercices.map((e, i) => (
          <section key={i} className="card stack">
            <div className="row between">
              <button type="button" className="lien" style={{ color: 'inherit' }} onClick={() => setOuvert(ouvert === i ? -1 : i)} aria-expanded={ouvert === i}>
                <h2>Exercice {i + 1}{e.titre ? ` — ${e.titre}` : ''}</h2>
              </button>
              <span className="row">
                <span className="chip">{e.points || 0} pts</span>
                {f.exercices.length > 1 && <button type="button" className="icon-btn" aria-label={`Retirer l'exercice ${i + 1}`} onClick={() => retirer(i)}><Icon name="trash" size={18} /></button>}
              </span>
            </div>
            {ouvert === i && (
              <>
                <div className="filtres">
                  <label className="champ">Titre<input type="text" value={e.titre} onChange={(ev) => setExo(i, { titre: ev.target.value })} required maxLength={140} /></label>
                  <label className="champ">Thème (pour le bilan)<input type="text" value={e.theme} onChange={(ev) => setExo(i, { theme: ev.target.value })} maxLength={60} placeholder="Suites, Probabilités…" /></label>
                  <label className="champ">Points<input type="number" min="0.5" max="100" step="0.5" value={e.points} onChange={(ev) => setExo(i, { points: ev.target.value })} required /></label>
                </div>
                {[['enonce', 'Énoncé'], ['corrige', 'Corrigé']].map(([k, label]) => (
                  <div key={k} className="stack" style={{ gap: 6 }}>
                    <div className="row between">
                      <label className="champ" htmlFor={`${k}-${i}`}>{label}</label>
                      <ImportIA actif={iaOn} onTexte={(t) => setExo(i, (x) => ({ [k]: ajouter(x[k], t) }))} />
                    </div>
                    <textarea id={`${k}-${i}`} value={e[k]} onChange={(ev) => setExo(i, { [k]: ev.target.value })} required={k === 'enonce'} style={{ minHeight: 140 }} />
                    {e[k] && <div className="note"><RichText text={e[k]} /></div>}
                  </div>
                ))}
              </>
            )}
          </section>
        ))}

        <div className="row between">
          <button type="button" className="btn" onClick={() => { setF({ ...f, exercices: [...f.exercices, { ...EXO }] }); setOuvert(f.exercices.length); }} disabled={f.exercices.length >= 20}>
            <Icon name="plus" size={18} /> Ajouter un exercice
          </button>
          <strong>Total : {total} points</strong>
        </div>
        <p className="muted small">Le corrigé sert à la notation automatique et à l’auto-évaluation : il n’apparaît pas pendant la simulation, mais reste consultable depuis la liste des sujets. La note finale est ramenée sur 20.</p>
        {err && <p className="note note-err" role="alert">{err}</p>}
        <div className="row between">
          <button className="btn btn-primary" disabled={busy}>{id ? 'Enregistrer le sujet' : 'Publier le sujet'}</button>
          {id && <button type="button" className="btn btn-plain" onClick={supprimer}>Supprimer</button>}
        </div>
      </form>
    </>
  );
}
