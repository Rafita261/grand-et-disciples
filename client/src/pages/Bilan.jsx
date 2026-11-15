import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, Charge, Bar, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';

const fr = (n) => String(n).replace('.', ',');

export default function Bilan() {
  const { id } = useParams();
  const q = useApi(`/attempts/${id}`);
  const [points, setPoints] = useState({});
  const [revoir, setRevoir] = useState(false);
  const [err, setErr] = useState('');

  const autoeval = async (at) => {
    setErr('');
    try {
      await api(`/attempts/${id}/autoeval`, { method: 'POST', body: { points: at.detail.map((_, i) => Number(points[i] || 0)) } });
      q.reload();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <>
      <Retour to="/examens">Examens</Retour>
      <Charge q={q}>
        {(at) => {
          if (!at.fin) return <Navigate to={`/simulation/${id}`} replace />;
          const note = at.note !== undefined && at.note !== null;
          const reussis = at.detail.filter((d) => d.points >= d.sur / 2).length;
          const exos = at.annale.exercices;
          return (
            <>
              <header>
                <h1>Mon bilan</h1>
                <p className="serif-it">Simulation · {at.annale.matiere} · Série {at.annale.serie}</p>
              </header>

              {note ? (
                <div className="cols-eq">
                  <section className="card card-accent stack" style={{ justifyItems: 'center' }}>
                    <p className="note-finale">{fr(at.note)} <small>/ 20</small></p>
                    <span className="chip chip-green"><Icon name="check" size={14} /> {at.estimation === 'ia' ? 'Estimation automatique · à vérifier' : 'Auto-évaluation'}</span>
                    <p><strong>{reussis} exercice{reussis > 1 ? 's' : ''} sur {at.detail.length} réussi{reussis > 1 ? 's' : ''}</strong></p>
                  </section>
                  <section className="card stack">
                    <h2>Détail par thème</h2>
                    {at.detail.map((d) => (
                      <div key={d.index} className="stack" style={{ gap: 4 }}>
                        <div className="row between"><span>{d.theme}</span><strong>{fr(d.points)} / {d.sur}</strong></div>
                        <Bar pct={(d.points / d.sur) * 100} />
                        {d.commentaire && <p className="muted small">{d.commentaire}</p>}
                      </div>
                    ))}
                  </section>
                </div>
              ) : (
                <p className="note note-warn">La notation automatique n’est pas disponible. Compare tes réponses au corrigé ci-dessous et attribue-toi les points, exercice par exercice.</p>
              )}

              {(revoir || !note) &&
                exos.map((e, i) => (
                  <article key={i} className="card stack">
                    <div className="row between"><h2>Exercice {i + 1} — {e.titre}</h2><span className="chip">{e.points} points</span></div>
                    <RichText text={e.enonce} />
                    <div className="note"><strong>Ta réponse.</strong> <RichText text={at.reponses.find((r) => r.index === i)?.texte || 'Aucune réponse.'} /></div>
                    <div className="note note-ok"><strong>Corrigé.</strong> <RichText text={e.corrige} /></div>
                    {!note && (
                      <label className="champ" style={{ maxWidth: 220 }}>Mes points (sur {e.points})
                        <input type="number" min="0" max={e.points} step="0.5" value={points[i] ?? ''} onChange={(ev) => setPoints({ ...points, [i]: ev.target.value })} />
                      </label>
                    )}
                  </article>
                ))}

              {err && <p className="note note-err">{err}</p>}
              <div className="row">
                {note ? (
                  <button className="btn btn-primary" onClick={() => setRevoir(!revoir)}>{revoir ? 'Masquer le corrigé' : 'Revoir mes erreurs'} <Icon name="chevron" size={16} /></button>
                ) : (
                  <button className="btn btn-primary" onClick={() => autoeval(at)}>Calculer ma note</button>
                )}
                <Link className="btn btn-plain" to="/annales">Autres sujets</Link>
              </div>
            </>
          );
        }}
      </Charge>
    </>
  );
}
