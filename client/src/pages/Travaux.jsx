import { Link, useNavigate } from 'react-router-dom';
import { api, ilYA } from '../api.js';
import { useApi, Charge, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const VERDICT = { correct: ['Correct', 'chip-green'], partiel: ['À revoir', 'chip-warn'], incorrect: ['À reprendre', 'chip-warn'] };

export default function Travaux() {
  const nav = useNavigate();
  const q = useApi('/works');
  const creer = async () => {
    try {
      const w = await api('/works', { method: 'POST', body: {} });
      nav(`/travaux/${w._id}`);
    } catch (e) {
      alert(e.message);
    }
  };
  const supprimer = async (w) => {
    if (!window.confirm(`Supprimer « ${w.titre} » ?`)) return;
    await api(`/works/${w._id}`, { method: 'DELETE' }).catch((e) => alert(e.message));
    q.reload();
  };
  return (
    <>
      <header className="row between">
        <div>
          <h1>Mes travaux</h1>
          <p className="serif-it">Rédiger et comprendre ses erreurs.</p>
        </div>
        <button className="btn btn-primary" onClick={creer}><Icon name="plus" size={18} /> Nouveau travail</button>
      </header>
      <Charge q={q}>
        {(liste) =>
          liste.length ? (
            <ul className="liste">
              {liste.map((w) => (
                <li key={w._id} className="item">
                  <Link to={`/travaux/${w._id}`} className="row grow" style={{ color: 'inherit', flexWrap: 'nowrap' }}>
                    <span className="pastille"><Icon name="layers" /></span>
                    <div className="grow">
                      <strong>{w.titre}</strong>
                      <p className="muted small">{w.format === 'latex' ? 'LaTeX' : 'Texte simple'} · modifié {ilYA(w.updatedAt)}</p>
                    </div>
                  </Link>
                  <span className="fin">
                    {w.publie && <span className="chip chip-accent">Publié</span>}
                    {w.feedback?.note != null && <span className="chip">{String(w.feedback.note).replace('.', ',')} / 20</span>}
                    {w.feedback?.verdict && w.feedback?.note == null && <span className={`chip ${VERDICT[w.feedback.verdict]?.[1]}`}>{VERDICT[w.feedback.verdict]?.[0]}</span>}
                    <button className="icon-btn" onClick={() => supprimer(w)} aria-label={`Supprimer ${w.titre}`}><Icon name="trash" size={18} /></button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Vide>Aucun travail pour le moment. Crée ton premier brouillon : en texte simple ou en LaTeX, au choix.</Vide>
          )
        }
      </Charge>
    </>
  );
}
