import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { duree } from '../api.js';
import { useApi, Charge, Bar, ICONE_MATIERE } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const LIBELLE = { termine: 'Terminé', 'en-cours': 'En cours', 'a-venir': 'À venir' };

export default function Accueil() {
  const { user } = useAuth();
  const q = useApi('/dashboard');
  return (
    <>
      <header>
        <h1>Bonjour, {user.nom}</h1>
        <p className="serif-it">Un pas de plus vers la réussite.</p>
      </header>
      <Charge q={q}>
        {(d) => (
          <>
            <div className="cols-2">
              {d.reprendre ? (
                <section className="card card-accent reprendre stack">
                  <h2>Reprendre ma révision</h2>
                  <p style={{ color: 'var(--accent-d)', fontFamily: 'var(--serif)', fontWeight: 600 }}>
                    {d.reprendre.matiere} · {d.reprendre.titre}
                  </p>
                  {d.reprendre.resume && <p className="muted small">{d.reprendre.resume}</p>}
                  <div className="row">
                    <Bar pct={d.reprendre.pct} tone="accent" />
                    <span className="pct">{d.reprendre.pct} %</span>
                    <Link className="btn btn-primary" to={`/revisions/${d.reprendre._id}`}>Continuer <Icon name="chevron" size={16} /></Link>
                  </div>
                </section>
              ) : (
                <p className="vide">Aucun chapitre pour le moment.</p>
              )}

              <section className="card stack">
                <h2 className="row"><Icon name="calendar" /> Mon objectif</h2>
                <p><strong>{d.objectif.fait} séance{d.objectif.fait > 1 ? 's' : ''} sur {d.objectif.cible}</strong> cette semaine</p>
                <div className="cases" aria-hidden="true">
                  {Array.from({ length: d.objectif.cible }, (_, i) => (
                    <i key={i} className={i < d.objectif.fait ? 'fait' : ''}>{i < d.objectif.fait && <Icon name="check" size={16} />}</i>
                  ))}
                </div>
                <p className="serif-it small">Rester régulier pour progresser.</p>
              </section>
            </div>

            <section className="stack">
              <h2>Mes matières</h2>
              <div className="grid">
                {d.matieres.map((m) => (
                  <Link key={m.matiere} to={`/revisions/${m.chapitreId}`} className="card stack" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="row">
                      <span className="pastille">{ICONE_MATIERE[m.matiere] || '📘'}</span>
                      <div className="grow">
                        <h3>{m.matiere}</h3>
                        <p className="muted small">Chapitre : {m.chapitre}</p>
                      </div>
                      <Icon name="chevron" size={18} />
                    </div>
                    <div className="row"><Bar pct={m.pct} /><span className="pct">{m.pct} %</span></div>
                  </Link>
                ))}
              </div>
            </section>

            <div className="cols-eq">
              <section className="card stack">
                <h2 className="row"><Icon name="layers" /> Mon parcours</h2>
                <div className="parcours">
                  {d.parcours.map((e, i) => (
                    <Link key={e._id} to={`/revisions/${e._id}`} className={`etape ${e.statut}`}>
                      <span className="rond">{e.statut === 'termine' ? <Icon name="check" size={18} /> : i + 1}</span>
                      <span className="small">{e.titre}</span>
                      <span className={`chip ${e.statut === 'termine' ? 'chip-green' : e.statut === 'en-cours' ? 'chip-accent' : ''}`}>
                        {LIBELLE[e.statut]}{e.statut === 'en-cours' ? ` (${e.pct} %)` : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="card stack">
                <h2 className="row"><Icon name="clipboard" /> À faire aujourd’hui</h2>
                <ul className="liste">
                  {d.aFaire.map((t) => (
                    <li key={t._id}>
                      <Link className="item" to={t.type === 'exercice' ? `/exercices/${t._id}` : `/annales/${t._id}`}>
                        <Icon name={t.type === 'exercice' ? 'pen' : 'cap'} />
                        <div className="grow"><strong>{t.titre}</strong><p className="muted small">{t.sousTitre}</p></div>
                        <span className="fin"><span className="chip"><Icon name="clock" size={13} /> {duree(t.duree)}</span></span>
                      </Link>
                    </li>
                  ))}
                  {!d.aFaire.length && <li className="muted">Tout est fait, bravo !</li>}
                </ul>
                <Link className="btn" to="/travaux"><Icon name="plus" size={18} /> Ajouter un travail</Link>
              </section>
            </div>
          </>
        )}
      </Charge>
    </>
  );
}
