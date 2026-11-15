import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ilYA } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, Charge, Avatar, BadgeRole, Retour, Vide } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';

function Solutions({ id }) {
  const { estEnseignant } = useAuth();
  const [tri, setTri] = useState('pertinentes');
  const q = useApi(`/exercises/${id}/solutions?tri=${tri}`);
  const act = (path, body) => api(path, { method: 'POST', body }).then(q.reload).catch((e) => alert(e.message));
  return (
    <section className="stack">
      <div className="row between">
        <h2>Solutions proposées par la communauté</h2>
        <select value={tri} onChange={(e) => setTri(e.target.value)} style={{ width: 'auto' }} aria-label="Trier par">
          <option value="pertinentes">Les plus pertinentes</option>
          <option value="recentes">Les plus récentes</option>
        </select>
      </div>
      <Charge q={q}>
        {(liste) =>
          liste.length ? (
            liste.map((s) => (
              <article key={s._id} className={`card stack ${s.validee ? 'card-ok' : ''}`}>
                <div className="row">
                  <Avatar nom={s.auteur?.nom} />
                  <div className="grow">
                    <strong>Proposition de {s.auteur?.nom || 'un membre'}</strong>
                    <p className="muted small">{s.auteur?.classe} · {ilYA(s.createdAt)}</p>
                  </div>
                  {s.validee && <span className="chip chip-green"><Icon name="check" size={14} /> Validée par un enseignant</span>}
                </div>
                <RichText text={s.contenu} />
                <div className="row">
                  <button className={`btn btn-sm ${s.monVote ? 'btn-primary' : ''}`} onClick={() => act(`/solutions/${s._id}/utile`)} aria-pressed={s.monVote}>
                    <Icon name="thumb" size={16} /> Utile ({s.utile})
                  </button>
                  {estEnseignant && (
                    <button className="btn btn-sm btn-plain" onClick={() => act(`/solutions/${s._id}/valider`, { validee: !s.validee })}>
                      {s.validee ? 'Retirer la validation' : 'Valider cette solution'}
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <Vide>Aucune solution pour le moment. Propose la première !</Vide>
          )
        }
      </Charge>
    </section>
  );
}

function Discussion({ id }) {
  const q = useApi(`/comments?exercise=${id}`);
  const [texte, setTexte] = useState('');
  const [err, setErr] = useState('');
  const envoyer = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api('/comments', { method: 'POST', body: { exercise: id, texte } });
      setTexte('');
      q.reload();
    } catch (e2) {
      setErr(e2.message);
    }
  };
  return (
    <section className="card stack">
      <h2 className="row"><Icon name="chat" /> Discussion {q.data ? `(${q.data.length})` : ''}</h2>
      <Charge q={q}>
        {(liste) =>
          liste.map((c) => (
            <div key={c._id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <Avatar nom={c.auteur?.nom} size={30} />
              <div className="grow">
                <p className="small row"><strong>{c.auteur?.nom}</strong> <BadgeRole user={c.auteur} /> <span className="muted">{ilYA(c.createdAt)}</span></p>
                <RichText text={c.texte} className="small" />
              </div>
            </div>
          ))
        }
      </Charge>
      <form className="stack" onSubmit={envoyer}>
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Pose une question ou réponds… (formules entre $ $)" style={{ minHeight: 70 }} required aria-label="Ton message" />
        {err && <p className="note note-err">{err}</p>}
        <button className="btn btn-sm" style={{ justifySelf: 'start' }}>Envoyer</button>
      </form>
    </section>
  );
}

export default function Exercice() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useApi(`/exercises/${id}`);
  const [onglet, setOnglet] = useState('enonce');
  const [aide, setAide] = useState({});
  const [redige, setRedige] = useState(false);
  const [texte, setTexte] = useState('');
  const [msg, setMsg] = useState(null);

  const reveler = async (champ) => {
    if (aide[champ] !== undefined) return setAide({ ...aide, [champ]: undefined });
    try {
      setAide({ ...aide, [champ]: (await api(`/exercises/${id}/${champ}`))[champ] || 'Non disponible.' });
    } catch (e) {
      setMsg({ err: e.message });
    }
  };
  const resolu = (v) => api(`/exercises/${id}/resolu`, { method: 'POST', body: { resolu: v } }).then(q.reload).catch((e) => setMsg({ err: e.message }));
  const publier = async () => {
    try {
      await api(`/exercises/${id}/solutions`, { method: 'POST', body: { contenu: texte } });
      setTexte('');
      setRedige(false);
      setMsg({ ok: 'Solution publiée. Merci pour ta contribution !' });
      setOnglet('solutions');
      q.reload();
    } catch (e) {
      setMsg({ err: e.message });
    }
  };
  const ouvrirEditeur = async () => {
    try {
      const w = await api('/works', { method: 'POST', body: { exercise: id } });
      nav(`/travaux/${w._id}`);
    } catch (e) {
      setMsg({ err: e.message });
    }
  };

  return (
    <>
      <Retour to="/exercices">Exercices</Retour>
      <Charge q={q}>
        {(e) => (
          <>
            <header className="stack" style={{ gap: 8 }}>
              <p className="muted small">
                {e.chapter?.matiere} / {e.chapter?.classe} / <Link to={`/revisions/${e.chapter?._id}`}>{e.chapter?.titre}</Link>
              </p>
              <h1>{e.chapter?.titre}</h1>
              <div className="row">
                <span className="chip chip-accent">{e.niveau}</span>
                <span className="chip"><Icon name="clock" size={13} /> {e.duree} min</span>
                {e.resolu && <span className="chip chip-green"><Icon name="check" size={13} /> Résolu</span>}
              </div>
            </header>

            <div className="tabs" role="tablist">
              {[['enonce', 'Énoncé'], ['solutions', `Solutions proposées (${e.nbSolutions})`], ['discussion', 'Discussion']].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={onglet === k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>
              ))}
            </div>
            {msg && <p className={`note ${msg.err ? 'note-err' : 'note-ok'}`} role="status">{msg.err || msg.ok}</p>}

            {onglet === 'enonce' && (
              <div className="cols-2">
                <div className="stack">
                  <article className="card stack">
                    <h2>Exercice {e.numero} — {e.titre}</h2>
                    <RichText text={e.enonce} />
                  </article>
                  {aide.indice !== undefined && <div className="note note-warn"><strong>Indice.</strong> <RichText text={aide.indice} /></div>}
                  {aide.correction !== undefined && <article className="card stack card-ok"><h2>Correction</h2><RichText text={aide.correction} /></article>}
                  {redige && (
                    <section className="card stack">
                      <h2>Ma solution</h2>
                      <textarea value={texte} onChange={(ev) => setTexte(ev.target.value)} placeholder="Rédige ta solution. Texte simple accepté ; formules entre $ $ si tu connais LaTeX." style={{ minHeight: 160 }} aria-label="Ma solution" />
                      {texte && <div className="note"><RichText text={texte} /></div>}
                      <div className="row">
                        <button className="btn btn-primary" onClick={publier} disabled={texte.trim().length < 10}>Publier</button>
                        <button className="btn btn-plain" onClick={ouvrirEditeur}>Ouvrir l’éditeur complet</button>
                      </div>
                      <p className="muted small">L’éditeur complet propose un clavier de symboles, l’import d’une photo et l’analyse automatique.</p>
                    </section>
                  )}
                </div>
                <aside className="card stack">
                  <h2>À toi de jouer</h2>
                  <p className="small">Tu as une idée de solution ? Partage-la avec la communauté.</p>
                  <button className="btn btn-primary btn-block" onClick={() => setRedige(true)}><Icon name="pen" size={18} /> Proposer une solution</button>
                  {e.aIndice && <button className="btn btn-block" onClick={() => reveler('indice')}><Icon name="bulb" size={18} /> {aide.indice !== undefined ? 'Masquer l’indice' : 'Demander un indice'}</button>}
                  {e.aCorrection && <button className="btn btn-block" onClick={() => reveler('correction')}><Icon name="eye" size={18} /> {aide.correction !== undefined ? 'Masquer la correction' : 'Voir la correction'}</button>}
                  <button className="btn btn-plain btn-block" onClick={() => resolu(!e.resolu)}>
                    <Icon name="check" size={18} /> {e.resolu ? 'Marquer comme non résolu' : 'J’ai réussi cet exercice'}
                  </button>
                </aside>
              </div>
            )}
            {onglet === 'solutions' && <Solutions id={id} />}
            {onglet === 'discussion' && <Discussion id={id} />}
          </>
        )}
      </Charge>
    </>
  );
}
