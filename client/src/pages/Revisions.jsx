import { Link } from 'react-router-dom';
import { useApi, Charge, Bar, ICONE_MATIERE, Vide } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Revisions() {
  const q = useApi('/chapters');
  return (
    <>
      <header>
        <h1>Révisions</h1>
        <p className="serif-it">Le cours, chapitre par chapitre.</p>
      </header>
      <Charge q={q}>
        {(chapitres) => {
          const groupes = {};
          chapitres.forEach((c) => (groupes[c.matiere] ||= []).push(c));
          if (!chapitres.length) return <Vide>Aucun chapitre publié pour le moment.</Vide>;
          return Object.entries(groupes).map(([matiere, liste]) => (
            <section key={matiere} className="stack">
              <h2 className="row"><span className="pastille">{ICONE_MATIERE[matiere] || '📘'}</span> {matiere}</h2>
              <ul className="liste">
                {liste.map((c) => (
                  <li key={c._id}>
                    <Link className="item" to={`/revisions/${c._id}`}>
                      <div className="grow stack" style={{ gap: 6 }}>
                        <strong>{c.titre}</strong>
                        {c.resume && <span className="muted small">{c.resume}</span>}
                        <div className="row"><Bar pct={c.pct} /><span className="pct">{c.pct} %</span></div>
                      </div>
                      <Icon name="chevron" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ));
        }}
      </Charge>
    </>
  );
}
