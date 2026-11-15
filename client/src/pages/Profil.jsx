import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, Charge, Bar, Avatar, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const fr = (n) => String(n).replace('.', ',');

function Courbe({ points }) {
  if (!points.length) return <Vide>Termine une simulation d’examen pour voir ta progression.</Vide>;
  const W = 480, H = 190, L = 28, R = 16, T = 22, B = 24;
  const x = (i) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v) => T + (1 - v / 20) * (H - T - B);
  const ligne = points.map((p, i) => `${x(i)},${y(p.note)}`).join(' ');
  return (
    <svg className="courbe" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Notes des simulations : ${points.map((p) => `${fr(p.note)} sur 20`).join(', ')}`} style={{ width: '100%', height: 'auto' }}>
      {[0, 5, 10, 15, 20].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e3d6c5" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ))}
      {points.length > 1 && <polygon points={`${x(0)},${y(0)} ${ligne} ${x(points.length - 1)},${y(0)}`} fill="#5d874826" />}
      <polyline points={ligne} fill="none" stroke="#5d8748" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.note)} r="4" fill="#fdf9f3" stroke="#5d8748" strokeWidth="2"><title>{p.titre}</title></circle>
          <text className="val" x={x(i)} y={y(p.note) - 9} textAnchor="middle">{fr(p.note)}</text>
          <text x={x(i)} y={H - 6} textAnchor="middle">n° {i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function Objectifs({ initial }) {
  const { setUser } = useAuth();
  const [liste, setListe] = useState(initial || []);
  const [texte, setTexte] = useState('');
  const sauver = async (next) => {
    setListe(next);
    try {
      const r = await api('/auth/me', { method: 'PATCH', body: { objectifs: next } });
      setUser(r.user);
    } catch (e) {
      alert(e.message);
    }
  };
  return (
    <section className="card stack">
      <h2>Mes objectifs</h2>
      <div>
        {liste.map((o, i) => (
          <label key={i} className="check">
            <input type="checkbox" checked={o.fait} onChange={() => sauver(liste.map((x, k) => (k === i ? { ...x, fait: !x.fait } : x)))} />
            <span className={`grow ${o.fait ? 'fait' : ''}`}>{o.texte}</span>
            <button type="button" className="icon-btn" aria-label={`Supprimer ${o.texte}`} onClick={() => sauver(liste.filter((_, k) => k !== i))}><Icon name="x" size={16} /></button>
          </label>
        ))}
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (texte.trim()) { sauver([...liste, { texte: texte.trim(), fait: false }]); setTexte(''); } }}>
        <input type="text" className="grow" style={{ width: 'auto' }} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Nouvel objectif…" maxLength={120} aria-label="Nouvel objectif" />
        <button className="btn btn-sm">Ajouter</button>
      </form>
    </section>
  );
}

function Reglages({ p, onDone }) {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ nom: user.nom, classe: user.classe, serie: user.serie, objectifHebdo: p.objectifHebdo });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/auth/me', { method: 'PATCH', body: { ...f, objectifHebdo: Number(f.objectifHebdo) } });
      setUser(r.user);
      onDone();
    } catch (e2) {
      setErr(e2.message);
    }
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <h2>Modifier mon profil</h2>
      <div className="filtres">
        <label className="champ">Nom<input type="text" value={f.nom} onChange={set('nom')} required minLength={2} /></label>
        <label className="champ">Classe<select value={f.classe} onChange={set('classe')}>{['Seconde', 'Première', 'Terminale'].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="champ">Série<select value={f.serie} onChange={set('serie')}>{['A', 'C', 'D', 'L', 'S', 'OSE'].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="champ">Séances par semaine<input type="number" min="1" max="7" value={f.objectifHebdo} onChange={set('objectifHebdo')} /></label>
      </div>
      {err && <p className="note note-err">{err}</p>}
      <div className="row"><button className="btn btn-primary">Enregistrer</button><button type="button" className="btn btn-plain" onClick={onDone}>Annuler</button></div>
    </form>
  );
}

export default function Profil() {
  const { id } = useParams();
  const { user, setUser, logout } = useAuth();
  const moi = !id || id === user._id;
  const q = useApi(moi ? '/profile' : `/users/${id}/profile`);
  const [onglet, setOnglet] = useState('progression');
  const [edition, setEdition] = useState(false);

  const visible = async (v) => {
    try {
      const r = await api('/auth/me', { method: 'PATCH', body: { profilPublic: v } });
      setUser(r.user);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <header className="row between">
        <h1>{moi ? 'Mon profil' : 'Profil'}</h1>
        {moi && (
          <label className="switch">
            Profil visible par la communauté
            <input type="checkbox" role="switch" checked={user.profilPublic} onChange={(e) => visible(e.target.checked)} />
          </label>
        )}
      </header>
      <Charge q={q}>
        {(p) => (
          <>
            <section className="card row">
              <Avatar nom={moi ? user.nom : p.user.nom} size={72} />
              <div className="grow" style={{ minWidth: 170 }}>
                <h2 style={{ fontSize: '1.6rem' }}>{moi ? user.nom : p.user.nom}</h2>
                <p className="muted">{p.user.role === 'eleve' ? 'Élève' : 'Enseignant'} · {moi ? user.classe : p.user.classe} {moi ? user.serie : p.user.serie}</p>
              </div>
              {moi && <button className="btn" onClick={() => setEdition(!edition)}><Icon name="pen" size={16} /> Modifier mon profil</button>}
            </section>
            {moi && edition && <Reglages p={p} onDone={() => { setEdition(false); q.reload(); }} />}

            <div className="grid-3">
              {[[p.stats.resolus, 'exercices résolus'], [p.stats.solutions, 'solutions partagées'], [p.stats.jours, 'jours de pratique']].map(([n, l]) => (
                <div key={l} className="card stat"><b>{n}</b><span>{l}</span></div>
              ))}
            </div>

            <div className="tabs" role="tablist">
              {[['progression', 'Progression'], ['contributions', 'Contributions']].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={onglet === k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>
              ))}
            </div>

            {onglet === 'progression' && (
              <>
                <div className="cols-2">
                  <section className="card stack">
                    <h2>Ma progression</h2>
                    <p className="muted small">Notes aux simulations d’examen (sur 20)</p>
                    <Courbe points={p.progression} />
                  </section>
                  <section className="card stack">
                    <h2>Compétences</h2>
                    {p.competences.map((c) => (
                      <div key={c.matiere + c.titre} className="stack" style={{ gap: 4 }}>
                        <span>{c.titre}</span>
                        <div className="row"><Bar pct={c.pct} /><span className="pct">{c.pct} %</span></div>
                      </div>
                    ))}
                    {!p.competences.length && <p className="muted">Résous des exercices pour faire apparaître tes compétences.</p>}
                  </section>
                </div>
                {moi && <Objectifs initial={p.objectifs} />}
              </>
            )}

            {onglet === 'contributions' && (
              <section className="stack">
                <ul className="liste">
                  {p.contributions.solutions.map((s) => (
                    <li key={s._id}>
                      <Link className="item" to={`/exercices/${s.exercise}`}>
                        <span className="pastille"><Icon name="pen" /></span>
                        <div className="grow"><strong>{s.titre}</strong><p className="muted small">Solution d’un exercice</p></div>
                        <span className="fin">{s.validee && <span className="chip chip-green"><Icon name="check" size={13} /> Validée</span>}<Icon name="chevron" size={18} /></span>
                      </Link>
                    </li>
                  ))}
                  {p.contributions.travaux.map((w) => (
                    <li key={w._id}>
                      <Link className="item" to={`/communaute/travaux/${w._id}`}>
                        <span className="pastille"><Icon name="layers" /></span>
                        <div className="grow"><strong>{w.titre}</strong><p className="muted small">Travail publié</p></div>
                        <Icon name="chevron" size={18} />
                      </Link>
                    </li>
                  ))}
                </ul>
                {!p.contributions.solutions.length && !p.contributions.travaux.length && <Vide>Aucune contribution pour le moment.</Vide>}
              </section>
            )}

            {moi && <button className="btn btn-plain" style={{ justifySelf: 'start' }} onClick={logout}><Icon name="logout" size={16} /> Se déconnecter</button>}
          </>
        )}
      </Charge>
    </>
  );
}
