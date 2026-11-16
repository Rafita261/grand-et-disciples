import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';
import ImportIA from '../components/ImportIA.jsx';

const SYMBOLES = ['²', '³', '√', '×', '÷', '≤', '≥', '≠', '∞', 'π', '∫', '→', '⇒', '∈', 'ℝ', 'ₙ'];
const hms = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');

export default function Simulation() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useApi(`/attempts/${id}`);
  const ia = useApi('/ai/status');
  const [i, setI] = useState(0);
  const [reponses, setReponses] = useState(null);
  const [reste, setReste] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [apercu, setApercu] = useState(false);
  const zone = useRef(null);
  const fini = useRef(false);
  const at = q.data;

  useEffect(() => {
    if (at && !reponses) setReponses(at.annale.exercices.map((_, k) => at.reponses.find((r) => r.index === k)?.texte || ''));
  }, [at, reponses]);

  // Référence vers l'état le plus récent : le chronomètre peut déclencher la remise à tout moment.
  const courant = useRef({ i, reponses });
  courant.current = { i, reponses };
  const sauver = () => {
    const c = courant.current;
    return api(`/attempts/${id}/reponse`, { method: 'PUT', body: { index: c.i, texte: c.reponses[c.i] } });
  };

  const terminer = async (force) => {
    if (fini.current) return;
    if (!force && !window.confirm('Remettre ta copie ? Tu ne pourras plus modifier tes réponses.')) return;
    fini.current = true;
    setBusy(true);
    try {
      await sauver().catch(() => {});
      await api(`/attempts/${id}/terminer`, { method: 'POST' });
      nav(`/bilan/${id}`, { replace: true });
    } catch (e) {
      fini.current = false;
      setErr(e.message);
      setBusy(false);
    }
  };

  // Le temps est compté depuis l'heure de début enregistrée par le serveur.
  useEffect(() => {
    if (!at || at.fin || !reponses) return;
    const limite = new Date(at.debut).getTime() + at.annale.dureeMin * 60000;
    const tic = () => {
      const s = Math.max(0, Math.round((limite - Date.now()) / 1000));
      setReste(s);
      if (s === 0) terminer(true);
    };
    tic();
    const t = setInterval(tic, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, Boolean(reponses)]);

  if (q.error) return <p className="note note-err">{q.error}</p>;
  if (!at || !reponses) return <p className="muted pad">Chargement…</p>;
  if (at.fin) return <Navigate to={`/bilan/${id}`} replace />;

  const exos = at.annale.exercices;
  const e = exos[i];
  const ecrire = (v) => setReponses(reponses.map((r, k) => (k === i ? v : r)));
  const inserer = (s) => {
    const el = zone.current;
    const a = el?.selectionStart ?? reponses[i].length;
    ecrire(reponses[i].slice(0, a) + s + reponses[i].slice(el?.selectionEnd ?? a));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(a + s.length, a + s.length);
    });
  };
  const aller = async (k) => {
    setErr('');
    setBusy(true);
    try {
      await sauver();
      setI(k);
      setApercu(false);
    } catch (e2) {
      setErr(`${e2.message} Ta réponse reste affichée ici : réessaie quand la connexion revient.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="row between">
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>{at.annale.titre}</h1>
          <p className="muted small">Simulation en cours</p>
        </div>
        <span className={`chrono ${reste !== null && reste < 300 ? 'fin' : ''}`} role="timer" aria-label="Temps restant"><Icon name="clock" size={15} /> {reste === null ? '…' : hms(reste)}</span>
      </header>

      <div className="stack" style={{ gap: 6 }}>
        <strong>Exercice {i + 1} sur {exos.length}</strong>
        <div className="segments">
          {exos.map((_, k) => (
            <button key={k} className={k === i ? 'actif' : reponses[k].trim() ? 'fait' : ''} onClick={() => k !== i && aller(k)} aria-label={`Aller à l'exercice ${k + 1}`} />
          ))}
        </div>
      </div>

      <article className="card stack">
        <div className="row between">
          <span className="chip chip-accent">Exercice {i + 1} · {e.theme}</span>
          <span className="muted small">Sur {e.points} points</span>
        </div>
        <RichText text={e.enonce} />
        <div className="row between">
          <strong>Votre réponse</strong>
          <span className="row">
            <ImportIA actif={Boolean(ia.data?.enabled)} label="Photo / PDF de ma copie" onTexte={(t) => { const c = courant.current; setReponses(c.reponses.map((r, k) => (k === c.i ? (r.trim() ? `${r.trimEnd()}\n\n${t}` : t) : r))); }} />
            <button className="lien small" onClick={() => setApercu(!apercu)}>{apercu ? 'Modifier' : 'Aperçu'}</button>
          </span>
        </div>
        {apercu ? (
          <div className="note"><RichText text={reponses[i] || 'Aucune réponse.'} /></div>
        ) : (
          <div className="zone">
            <div className="palette">{SYMBOLES.map((s) => <button key={s} type="button" onClick={() => inserer(s)}>{s}</button>)}</div>
            <textarea ref={zone} value={reponses[i]} onChange={(ev) => ecrire(ev.target.value)} placeholder="Rédigez votre réponse ici… (texte simple, ou LaTeX entre $ $)" style={{ minHeight: 200 }} aria-label="Votre réponse" />
          </div>
        )}
        <p className="note small"><Icon name="alert" size={14} /> Correction disponible après remise.</p>
        {err && <p className="note note-err" role="alert">{err}</p>}
        <div className="row">
          {i < exos.length - 1 ? (
            <button className="btn btn-primary" onClick={() => aller(i + 1)} disabled={busy}>Enregistrer et continuer <Icon name="chevron" size={16} /></button>
          ) : (
            <button className="btn btn-primary" onClick={() => aller(i)} disabled={busy}>Enregistrer</button>
          )}
          <button className="btn btn-plain" onClick={() => terminer(false)} disabled={busy}>Terminer l’examen</button>
        </div>
      </article>
    </>
  );
}
