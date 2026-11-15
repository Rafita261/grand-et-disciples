import { Link } from 'react-router-dom';
import { ilYA } from '../api.js';
import { useApi, Charge, Avatar, BadgeRole, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Communaute() {
  const q = useApi('/community/feed');
  return (
    <>
      <header>
        <h1>Communauté</h1>
        <p className="serif-it">Chercher, résoudre, échanger.</p>
      </header>
      <Charge q={q}>
        {(d) => (
          <div className="cols-eq">
            <section className="stack">
              <h2>Dernières solutions</h2>
              <ul className="liste">
                {d.solutions.map((s) => (
                  <li key={s._id}>
                    <Link className="item" to={`/exercices/${s.exercise._id}`}>
                      <Avatar nom={s.auteur?.nom} />
                      <div className="grow">
                        <strong>{s.exercise.titre}</strong>
                        <p className="muted small">par {s.auteur?.nom} · {ilYA(s.createdAt)}</p>
                      </div>
                      <span className="fin">
                        {s.validee && <span className="chip chip-green"><Icon name="check" size={13} /> Validée</span>}
                        <span className="chip"><Icon name="thumb" size={13} /> {s.utile}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {!d.solutions.length && <Vide>Pas encore de solution partagée.</Vide>}

              <h2>Travaux en attente d’avis</h2>
              <ul className="liste">
                {d.travaux.map((w) => (
                  <li key={w._id}>
                    <Link className="item" to={`/communaute/travaux/${w._id}`}>
                      <span className="pastille"><Icon name="layers" /></span>
                      <div className="grow"><strong>{w.titre}</strong><p className="muted small">par {w.auteur?.nom} · {ilYA(w.updatedAt)}</p></div>
                      <Icon name="chevron" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
              {!d.travaux.length && <Vide>Aucun travail publié pour le moment.</Vide>}
            </section>

            <section className="stack">
              <h2>Discussions récentes</h2>
              {d.discussions.map((c) => (
                <Link key={c._id} className="card stack" style={{ color: 'inherit', textDecoration: 'none', gap: 6 }} to={`/exercices/${c.exercise._id}`}>
                  <p className="small row"><Avatar nom={c.auteur?.nom} size={26} /> <strong>{c.auteur?.nom}</strong> <BadgeRole user={c.auteur} /> <span className="muted">{ilYA(c.createdAt)}</span></p>
                  <p className="small">{c.texte.length > 160 ? `${c.texte.slice(0, 160)}…` : c.texte}</p>
                  <p className="muted small">Sur : {c.exercise.titre}</p>
                </Link>
              ))}
              {!d.discussions.length && <Vide>Aucune discussion pour le moment.</Vide>}
            </section>
          </div>
        )}
      </Charge>
    </>
  );
}
