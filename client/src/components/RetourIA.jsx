import RichText from './RichText.jsx';
import Icon from './Icon.jsx';

const VERDICT = { correct: 'Solution correcte', partiel: 'Solution à revoir', incorrect: 'Solution à reprendre' };
const fr = (n) => String(n).replace('.', ',');

/**
 * Affiche le retour de l'IA : note privée sur 20, étapes, version corrigée en LaTeX.
 * - contenu / onAppliquer : permettent d'appliquer une correction ponctuelle dans le texte ;
 * - onReecrire : remplace le texte par la version corrigée.
 */
export default function RetourIA({ fb, contenu = '', onAppliquer, onReecrire }) {
  return (
    <div className="stack">
      <div className="row between">
        <strong>{VERDICT[fb.verdict] || 'Analyse'}</strong>
        {fb.note != null && (
          <span className="row" style={{ gap: 6 }}>
            <span className="note-privee">{fr(fb.note)} <small>/ 20</small></span>
            <span className="chip">Note privée</span>
          </span>
        )}
      </div>
      {fb.resume && <p className="small">{fb.resume}</p>}
      {fb.etapes.map((e, i) => (
        <div key={i} className={`etape-fb stack ${e.statut === 'correct' ? '' : e.statut}`} style={{ gap: 6 }}>
          <p className="row"><Icon name={e.statut === 'correct' ? 'check' : 'alert'} size={16} /> <strong>{e.titre}</strong></p>
          {e.commentaire && <RichText text={e.commentaire} className="small" />}
          {e.correction && <div className="card" style={{ padding: 10 }}><RichText text={e.correction} /></div>}
          {onAppliquer && e.extrait && e.correction && contenu.includes(e.extrait) && (
            <button type="button" className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }} onClick={() => onAppliquer(e)}>Appliquer la suggestion <Icon name="chevron" size={14} /></button>
          )}
        </div>
      ))}
      {fb.reecriture && (
        <details className="card" open>
          <summary><strong>Ta démarche, corrigée et rédigée en LaTeX</strong></summary>
          <div style={{ marginTop: 10 }}><RichText text={fb.reecriture} /></div>
          {onReecrire && fb.reecriture !== contenu && (
            <button type="button" className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => onReecrire(fb.reecriture)}>
              <Icon name="spark" size={16} /> Utiliser cette version
            </button>
          )}
        </details>
      )}
      <p className="muted small">Estimation produite par une IA : elle peut se tromper. Ta note n’est visible que par toi ; relis la version corrigée avant de la publier.</p>
    </div>
  );
}
