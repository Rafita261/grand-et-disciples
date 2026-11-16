import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ilYA } from '../api.js';
import { useApi, Charge, Avatar, BadgeRole, Retour } from '../components/ui.jsx';
import RichText from '../components/RichText.jsx';
import ImportIA from '../components/ImportIA.jsx';

export default function TravailPublic() {
  const { id } = useParams();
  const q = useApi(`/community/works/${id}`);
  const avis = useApi(`/comments?work=${id}`);
  const ia = useApi('/ai/status');
  const [texte, setTexte] = useState('');
  const [err, setErr] = useState('');
  const envoyer = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api('/comments', { method: 'POST', body: { work: id, texte } });
      setTexte('');
      avis.reload();
    } catch (e2) {
      setErr(e2.message);
    }
  };
  return (
    <>
      <Retour to="/communaute">Communauté</Retour>
      <Charge q={q}>
        {(w) => (
          <>
            <header>
              <h1>{w.titre}</h1>
              <p className="muted small">par {w.auteur?.nom} · {ilYA(w.updatedAt)}</p>
            </header>
            {w.enonce && <article className="card stack"><h2>Énoncé</h2><RichText text={w.enonce} /></article>}
            <article className="card stack"><h2>Solution proposée</h2><RichText text={w.contenu} /></article>
          </>
        )}
      </Charge>
      <section className="card stack">
        <h2>Avis</h2>
        <Charge q={avis}>
          {(liste) =>
            liste.length ? (
              liste.map((c) => (
                <div key={c._id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <Avatar nom={c.auteur?.nom} size={30} />
                  <div className="grow">
                    <p className="small row"><strong>{c.auteur?.nom}</strong> <BadgeRole user={c.auteur} /> <span className="muted">{ilYA(c.createdAt)}</span></p>
                    <RichText text={c.texte} className="small" />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Pas encore d’avis.</p>
            )
          }
        </Charge>
        <form className="stack" onSubmit={envoyer}>
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Donne ton avis, signale une erreur…" style={{ minHeight: 70 }} required aria-label="Ton avis" />
          {err && <p className="note note-err">{err}</p>}
          <div className="row">
            <button className="btn btn-sm">Envoyer</button>
            <ImportIA actif={Boolean(ia.data?.enabled)} label="Photo / PDF" onTexte={(t) => setTexte((a) => (a.trim() ? `${a.trimEnd()}\n\n${t}` : t))} />
          </div>
        </form>
      </section>
    </>
  );
}
