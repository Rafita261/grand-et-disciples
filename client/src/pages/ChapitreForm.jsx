import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import ImportIA from '../components/ImportIA.jsx';

const VIDE = { matiere: '', titre: '', classe: 'Terminale', resume: '', contenu: '', ordre: '' };

/** Création (/revisions/nouveau) ou modification (/revisions/:id/modifier) d'un chapitre — enseignants. */
export default function ChapitreForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const existants = useApi('/chapters');
  const ia = useApi('/ai/status');
  const [f, setF] = useState(id ? null : VIDE);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api(`/chapters/${id}`).then((c) => setF({ ...VIDE, ...c, resume: c.resume || '', contenu: c.contenu || '' })).catch((e) => setErr(e.message));
  }, [id]);

  if (!f) return err ? <p className="note note-err">{err}</p> : <p className="muted pad">Chargement…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const matieres = [...new Set((existants.data || []).map((c) => c.matiere))];

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api(id ? `/chapters/${id}` : '/chapters', { method: id ? 'PUT' : 'POST', body: f });
      nav(`/revisions/${r._id}`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };
  const supprimer = async () => {
    if (!window.confirm(`Supprimer le chapitre « ${f.titre} » ?`)) return;
    try {
      await api(`/chapters/${id}`, { method: 'DELETE' });
      nav('/revisions');
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <>
      <Retour to={id ? `/revisions/${id}` : '/revisions'}>Révisions</Retour>
      <h1>{id ? 'Modifier le chapitre' : 'Nouveau chapitre'}</h1>
      <form className="card stack" onSubmit={submit}>
        <div className="filtres">
          <label className="champ">Matière
            <input type="text" list="matieres" value={f.matiere} onChange={set('matiere')} required maxLength={60} placeholder="Mathématiques, SVT, Malagasy…" />
            <datalist id="matieres">{matieres.map((m) => <option key={m} value={m} />)}</datalist>
          </label>
          <label className="champ">Classe
            <select value={f.classe} onChange={set('classe')}>{['Seconde', 'Première', 'Terminale'].map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          {id && <label className="champ">Position dans la matière<input type="number" min="1" value={f.ordre} onChange={set('ordre')} /></label>}
        </div>
        <label className="champ">Titre du chapitre<input type="text" value={f.titre} onChange={set('titre')} required maxLength={140} /></label>
        <label className="champ">Résumé en une phrase<input type="text" value={f.resume} onChange={set('resume')} maxLength={300} /></label>

        <div className="stack" style={{ gap: 6 }}>
          <div className="row between">
            <label className="champ" htmlFor="contenu">Cours</label>
            <ImportIA actif={Boolean(ia.data?.enabled)} onTexte={(t) => setF((p) => ({ ...p, contenu: p.contenu.trim() ? `${p.contenu.trimEnd()}\n\n${t}` : t }))} />
          </div>
          <textarea id="contenu" value={f.contenu} onChange={set('contenu')} style={{ minHeight: 260 }} placeholder={'\\section{L\'essentiel}\nTexte du cours, formules entre $ $ ou \\[ \\].\n\n\\textbf{À retenir} : …'} />
          <p className="muted small">Mise en forme : <code>\section{'{Titre}'}</code>, <code>\textbf{'{gras}'}</code>, listes <code>\begin{'{itemize}'} \item …</code>, formules entre <code>$ $</code>.</p>
          {f.contenu && <div className="note"><RichText text={f.contenu} /></div>}
        </div>

        {err && <p className="note note-err" role="alert">{err}</p>}
        <div className="row between">
          <button className="btn btn-primary" disabled={busy}>{id ? 'Enregistrer' : 'Créer le chapitre'}</button>
          {id && <button type="button" className="btn btn-plain" onClick={supprimer}>Supprimer</button>}
        </div>
      </form>
    </>
  );
}
