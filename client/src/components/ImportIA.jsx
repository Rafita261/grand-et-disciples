import { useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

// Réduit la photo sur le téléphone avant l'envoi : quelques centaines de Ko au lieu de plusieurs Mo.
async function compresser(file) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.75).split(',')[1];
}
const enBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/** Envoie une photo ou un PDF à Gemini et renvoie sa transcription (LaTeX ou texte simple). */
export async function transcrireFichier(file, format = 'latex') {
  const pdf = file.type === 'application/pdf';
  if (pdf && file.size > 4_000_000) throw new Error('PDF trop lourd (4 Mo maximum).');
  const data = pdf ? await enBase64(file) : await compresser(file);
  const r = await api('/ai/transcrire', { method: 'POST', body: { mimeType: pdf ? 'application/pdf' : 'image/jpeg', data, format } });
  return r.texte;
}

/** Bouton « Photo / PDF » : transcrit le fichier choisi et passe le texte à onTexte. */
export default function ImportIA({ actif, onTexte, format = 'latex', label = 'Photo / PDF → LaTeX' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const choisir = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      onTexte(await transcrireFichier(file, format));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="row" style={{ fontWeight: 400 }}>
      <label className={`btn btn-plain btn-sm ${actif && !busy ? '' : 'desactive'}`} title={actif ? '' : 'Clé Gemini non configurée sur le serveur'}>
        <Icon name="camera" size={16} /> {busy ? 'Lecture en cours…' : label}
        <input type="file" accept="image/*,application/pdf" hidden disabled={!actif || busy} onChange={choisir} />
      </label>
      {err && <span className="note note-err small" role="alert">{err}</span>}
    </span>
  );
}
