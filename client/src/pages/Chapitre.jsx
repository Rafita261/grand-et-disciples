import { Link, useParams } from 'react-router-dom';
import { useApi, Charge, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../auth.jsx';

export default function Chapitre() {
  const { id } = useParams();
  const q = useApi(`/chapters/${id}`);
  const { estEnseignant } = useAuth();
  return (
    <>
      <Retour to="/revisions">Révisions</Retour>
      <Charge q={q}>
        {(c) => (
          <>
            <header className="row between">
              <div>
                <p className="muted small">{c.matiere} · {c.classe}</p>
                <h1>{c.titre}</h1>
              </div>
              {estEnseignant && <Link className="btn btn-sm" to={`/revisions/${id}/modifier`}><Icon name="pen" size={16} /> Modifier</Link>}
            </header>
            <article className="card">{c.contenu ? <RichText text={c.contenu} /> : <p className="muted">Le cours de ce chapitre n’est pas encore rédigé.</p>}</article>
            <section className="stack">
              <div className="row between">
                <h2>S’exercer sur ce chapitre</h2>
                <Link className="btn btn-sm" to="/exercices/nouveau"><Icon name="plus" size={16} /> Proposer un exercice</Link>
              </div>
              <ul className="liste">
                {c.exercices.map((e) => (
                  <li key={e._id}>
                    <Link className="item" to={`/exercices/${e._id}`}>
                      <span className={`pastille ${e.resolu ? 'ok' : ''}`}><Icon name={e.resolu ? 'check' : 'pen'} /></span>
                      <div className="grow"><strong>Exercice {e.numero} — {e.titre}</strong><p className="muted small">{e.niveau} · {e.duree} min</p></div>
                      <Icon name="chevron" size={18} />
                    </Link>
                  </li>
                ))}
                {!c.exercices.length && <li className="muted">Pas encore d’exercice pour ce chapitre.</li>}
              </ul>
            </section>
          </>
        )}
      </Charge>
    </>
  );
}
