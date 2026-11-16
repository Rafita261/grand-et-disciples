import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { duree } from '../api.js';
import { useApi, Charge, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';
import { useDemarrer } from './Annales.jsx';

export default function Sujet() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const corrige = sp.get('corrige') === '1';
  const q = useApi(`/annales/${id}${corrige ? '?corrige=1' : ''}`);
  const demarrer = useDemarrer();
  const { estEnseignant } = useAuth();
  return (
    <>
      <div className="no-print"><Retour to="/annales">Annales du bac</Retour></div>
      <Charge q={q}>
        {(a) => (
          <>
            <header className="stack" style={{ gap: 6 }}>
              <h1>{a.titre}</h1>
              <p className="muted">{a.type} · {a.matiere} · Série {a.serie} · {duree(a.dureeMin)}</p>
              <div className="row no-print">
                <button className="btn btn-primary" onClick={() => demarrer(a._id)}>Commencer un examen <Icon name="chevron" size={16} /></button>
                <button className="btn btn-plain" onClick={() => window.print()}><Icon name="download" size={16} /> PDF</button>
                <button className="btn btn-plain" onClick={() => setSp(corrige ? {} : { corrige: '1' })}><Icon name="check" size={16} /> {corrige ? 'Masquer le corrigé' : 'Afficher le corrigé'}</button>
                {estEnseignant && <Link className="btn btn-plain" to={`/annales/${id}/modifier`}><Icon name="pen" size={16} /> Modifier</Link>}
              </div>
            </header>
            {a.exercices.map((e, i) => (
              <article key={i} className="card stack">
                <div className="row between">
                  <h2>Exercice {i + 1} — {e.titre}</h2>
                  <span className="chip">{e.points} points</span>
                </div>
                <RichText text={e.enonce} />
                {corrige && e.corrige && <div className="note note-ok"><strong>Corrigé.</strong> <RichText text={e.corrige} /></div>}
              </article>
            ))}
          </>
        )}
      </Charge>
    </>
  );
}
