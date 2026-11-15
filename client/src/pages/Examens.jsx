import { Link } from 'react-router-dom';
import { useApi, Charge, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Examens() {
  const q = useApi('/attempts');
  return (
    <>
      <header>
        <h1>Examens</h1>
        <p className="serif-it">Mes simulations, en cours et terminées.</p>
      </header>
      <Charge q={q}>
        {(liste) =>
          liste.length ? (
            <ul className="liste">
              {liste.map((a) => (
                <li key={a._id}>
                  <Link className="item" to={a.fin ? `/bilan/${a._id}` : `/simulation/${a._id}`}>
                    <span className={`pastille ${a.fin ? 'ok' : ''}`}><Icon name={a.fin ? 'check' : 'clock'} /></span>
                    <div className="grow">
                      <strong>{a.annale?.titre || 'Sujet supprimé'}</strong>
                      <p className="muted small">{new Date(a.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className="fin">
                      {!a.fin ? <span className="chip chip-accent">En cours</span> : a.note != null ? <strong>{String(a.note).replace('.', ',')} / 20</strong> : <span className="chip chip-warn">À évaluer</span>}
                      <Icon name="chevron" size={18} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vide>Aucune simulation pour le moment.</Vide>
          )
        }
      </Charge>
      <Link className="btn btn-primary" style={{ justifySelf: 'start' }} to="/annales">Commencer un examen</Link>
    </>
  );
}
