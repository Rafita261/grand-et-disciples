import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';
import RetourIA from '../components/RetourIA.jsx';
import ImportIA from '../components/ImportIA.jsx';
import { transcrireFichier } from '../components/ImportIA.jsx';

// Clavier de symboles pour écrire des maths sans connaître LaTeX.
const SYMBOLES = ['²', '³', '√', '×', '÷', '±', '≤', '≥', '≠', '≈', '∞', 'π', '∑', '∫', '→', '⇒', '⇔', '∈', 'ℝ', 'ℕ', 'α', 'β', 'Δ', 'θ', '₀', '₁', '₂', 'ₙ', 'ₙ₊₁'];
const LATEX = [
  ['a/b', '\\frac{a}{b}'], ['√', '\\sqrt{x}'], ['x²', 'x^{2}'], ['uₙ', 'u_{n}'], ['∫', '\\int_{a}^{b} f(x)\\,dx'],
  ['∑', '\\sum_{k=0}^{n} '], ['lim', '\\lim_{x \\to +\\infty} '], ['≤', '\\leq '], ['≥', '\\geq '], ['≠', '\\neq '],
  ['∞', '\\infty'], ['ℝ', '\\mathbb{R}'], ['$ $', '$ $'], ['formule', '\n\\[\n\n\\]\n'], ['titre', '\\section{Titre}\n'],
];
const ETAT = { ok: ['Enregistré', 'chip-green'], attente: ['Modifié…', ''], envoi: ['Enregistrement…', ''], erreur: ['Non enregistré', 'chip-warn'] };

export default function Editeur() {
  const { id } = useParams();
  const nav = useNavigate();
  const ia = useApi('/ai/status');
  const [w, setW] = useState(null);
  const [fatal, setFatal] = useState('');
  const [etat, setEtat] = useState('ok');
  const [vue, setVue] = useState('ecrire');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const zone = useRef(null);
  const sale = useRef(false);

  useEffect(() => {
    api(`/works/${id}`).then(setW).catch((e) => setFatal(e.message));
  }, [id]);

  const maj = (patch) => {
    sale.current = true;
    setEtat('attente');
    setW((p) => ({ ...p, ...patch }));
  };

  const sauver = useCallback(
    async (doc) => {
      sale.current = false;
      setEtat('envoi');
      try {
        await api(`/works/${id}`, { method: 'PUT', body: { titre: doc.titre, format: doc.format, enonce: doc.enonce, contenu: doc.contenu } });
        if (!sale.current) setEtat('ok');
      } catch (e) {
        sale.current = true;
        setEtat('erreur');
        throw e;
      }
    },
    [id]
  );

  // Enregistrement automatique, 1,5 s après la dernière frappe.
  useEffect(() => {
    if (!w || !sale.current) return;
    const t = setTimeout(() => sauver(w).catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [w, sauver]);

  if (fatal) return <p className="note note-err">{fatal}</p>;
  if (!w) return <p className="muted pad">Chargement…</p>;

  const iaOn = Boolean(ia.data?.enabled);
  const lancer = async (nom, fn) => {
    setBusy(nom);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ err: e.message });
    } finally {
      setBusy('');
    }
  };

  const inserer = (s) => {
    const el = zone.current;
    const a = el?.selectionStart ?? w.contenu.length;
    const b = el?.selectionEnd ?? a;
    maj({ contenu: w.contenu.slice(0, a) + s + w.contenu.slice(b) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(a + s.length, a + s.length);
    });
  };
  const ajouter = (texte, extra = {}) => maj({ contenu: w.contenu.trim() ? `${w.contenu.trimEnd()}\n\n${texte}` : texte, ...extra });

  const importerFichier = (file) =>
    lancer('fichier', async () => {
      if (file.size > 500_000) throw new Error('Fichier texte trop volumineux.');
      ajouter(await file.text(), /\.tex$/i.test(file.name) ? { format: 'latex' } : {});
    });

  const importerPhoto = (file) =>
    lancer('photo', async () => {
      const r = { texte: await transcrireFichier(file, w.format) };
      ajouter(r.texte);
      setMsg({ ok: 'Transcription ajoutée. Relis-la : une lecture automatique peut se tromper.' });
    });

  const convertir = () =>
    lancer('latex', async () => {
      const r = await api('/ai/latex', { method: 'POST', body: { texte: w.contenu } });
      maj({ contenu: r.texte, format: 'latex' });
    });

  const analyser = () =>
    lancer('analyse', async () => {
      await sauver(w);
      const feedback = await api(`/works/${id}/analyser`, { method: 'POST' });
      setW((p) => ({ ...p, feedback }));
      setVue('correction');
    });

  const publier = () =>
    lancer('publier', async () => {
      await sauver(w);
      const r = await api(`/works/${id}/publier`, { method: 'POST' });
      nav(r.exercise ? `/exercices/${r.exercise}` : `/communaute/travaux/${r.work}`);
    });

  // La correction est insérée telle quelle (fonction de remplacement : les « $ » du LaTeX ne sont pas interprétés).
  const appliquer = (e) => maj({ contenu: w.contenu.replace(e.extrait, () => e.correction) });

  const fb = w.feedback?.genereLe ? w.feedback : null;
  const cache = (v) => (vue === v ? '' : 'cache-mobile');

  return (
    <>
      <div className="row between no-print">
        <Retour to="/travaux">Mes travaux</Retour>
        <span className={`chip ${ETAT[etat][1]}`}>{etat === 'ok' && <Icon name="check" size={13} />} {ETAT[etat][0]}</span>
      </div>
      <input className="titre-edit no-print" value={w.titre} onChange={(e) => maj({ titre: e.target.value })} aria-label="Titre du travail" maxLength={140} />

      <div className="row no-print">
        <label className="btn btn-plain btn-sm">
          <Icon name="upload" size={16} /> Importer un fichier
          <input type="file" accept=".tex,.txt,.md,text/plain" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importerFichier(f); }} />
        </label>
        <label className={`btn btn-plain btn-sm ${iaOn ? '' : 'desactive'}`} aria-disabled={!iaOn}>
          <Icon name="camera" size={16} /> {busy === 'photo' ? 'Lecture…' : 'Photo / PDF'}
          <input type="file" accept="image/*,application/pdf" hidden disabled={!iaOn || Boolean(busy)} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importerPhoto(f); }} />
        </label>
        <button className="btn btn-plain btn-sm" onClick={() => window.print()}><Icon name="download" size={16} /> Exporter en PDF</button>
        <button className="btn btn-primary btn-sm" onClick={analyser} disabled={!iaOn || Boolean(busy)}>
          <Icon name="spark" size={16} /> {busy === 'analyse' ? 'Analyse en cours…' : 'Analyser ma solution'}
        </button>
      </div>
      {ia.data && !iaOn && <p className="note no-print">Analyse automatique et lecture de photo indisponibles : la clé Gemini n’est pas configurée sur le serveur. Tu peux quand même rédiger, exporter et publier pour demander un avis.</p>}
      {msg && <p className={`note no-print ${msg.err ? 'note-err' : 'note-ok'}`} role="status">{msg.err || msg.ok}</p>}

      <details className="card no-print" open={!w.enonce && !w.contenu}>
        <summary><strong>Énoncé de l’exercice</strong> <span className="muted small">(aide la correction automatique)</span></summary>
        <div style={{ marginTop: 10 }}>
          <ImportIA actif={iaOn} label="Photo / PDF de l’énoncé" onTexte={(t) => maj({ enonce: w.enonce.trim() ? `${w.enonce.trimEnd()}\n\n${t}` : t })} />
        </div>
        <textarea value={w.enonce} onChange={(e) => maj({ enonce: e.target.value })} placeholder="Recopie ou colle ici l’énoncé." style={{ marginTop: 10, minHeight: 80 }} aria-label="Énoncé" />
      </details>

      <div className="seg seul-mobile no-print" role="tablist">
        {[['ecrire', 'Écrire'], ['apercu', 'Aperçu'], ['correction', 'Correction']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} style={{ flex: 1 }} onClick={() => setVue(k)}>{l}</button>
        ))}
      </div>

      <div className="editeur">
        <section className={`zone no-print ${cache('ecrire')}`}>
          <div className="zone-tete">
            <div className="seg">
              <button className={w.format === 'texte' ? 'actif' : ''} onClick={() => maj({ format: 'texte' })}>Texte simple</button>
              <button className={w.format === 'latex' ? 'actif' : ''} onClick={() => maj({ format: 'latex' })}>LaTeX</button>
            </div>
            {w.format === 'texte' && (
              <button className="btn btn-sm btn-plain" onClick={convertir} disabled={!iaOn || Boolean(busy) || w.contenu.trim().length < 3}>
                {busy === 'latex' ? 'Conversion…' : 'Convertir en LaTeX'}
              </button>
            )}
          </div>
          <div className="palette" aria-label="Symboles mathématiques">
            {w.format === 'texte'
              ? SYMBOLES.map((s) => <button key={s} type="button" onClick={() => inserer(s)}>{s}</button>)
              : LATEX.map(([l, s]) => <button key={l} type="button" onClick={() => inserer(s)} title={s.trim()}>{l}</button>)}
          </div>
          <textarea
            ref={zone}
            className={w.format === 'latex' ? 'code' : ''}
            value={w.contenu}
            onChange={(e) => maj({ contenu: e.target.value })}
            spellCheck={w.format === 'texte'}
            placeholder={w.format === 'texte' ? 'Rédige ta solution comme sur ta copie. Utilise les boutons ci-dessus pour les symboles : f(2) = 2² − 4×2 + 3' : 'Sa dérivée est\n\\[\n  f\'(x) = 2x - 4.\n\\]'}
            aria-label="Ma solution"
          />
        </section>

        <div className="stack">
          <section className={`zone zone-apercu ${cache('apercu')}`}>
            <div className="zone-tete no-print"><span className="row"><Icon name="eye" size={18} /> Aperçu</span></div>
            <div className="apercu">
              <h2 style={{ marginBottom: 12 }}>{w.titre}</h2>
              {w.contenu.trim() ? <RichText text={w.contenu} /> : <p className="muted">Ton texte mis en forme apparaîtra ici.</p>}
            </div>
          </section>

          <section className={`zone no-print ${cache('correction')}`}>
            <div className="zone-tete" style={{ background: 'var(--warn-soft)' }}><span className="row"><Icon name="alert" size={18} /> Retour automatique · À vérifier</span></div>
            <div className="apercu stack">
              {fb ? (
                <RetourIA fb={fb} contenu={w.contenu} onAppliquer={appliquer} onReecrire={(t) => { maj({ contenu: t, format: 'latex' }); setVue('ecrire'); }} />
              ) : (
                <p className="muted">Lance « Analyser ma solution » pour vérifier tes étapes une à une. Le retour reste indicatif : un enseignant peut le confirmer.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <button className="btn no-print" style={{ justifySelf: 'start' }} onClick={publier} disabled={Boolean(busy) || w.contenu.trim().length < 10}>
        <Icon name="chat" size={18} /> {w.exercise ? 'Publier comme solution de l’exercice' : 'Publier et demander un avis'}
      </button>
    </>
  );
}
