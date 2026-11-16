import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Connexion() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ nom: '', email: '', password: '', serie: 'C', role: 'eleve', codeEnseignant: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') await login(f.email, f.password);
      else await register(f);
      nav('/', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="card stack" onSubmit={submit}>
        <div className="marque">
          <span className="logo">E</span>
          <span>Entraide</span>
        </div>
        <p className="serif-it" style={{ textAlign: 'center' }}>Un pas de plus vers la réussite.</p>
        <div className="seg" style={{ justifySelf: 'center' }}>
          <button type="button" className={mode === 'login' ? 'actif' : ''} onClick={() => setMode('login')}>Se connecter</button>
          <button type="button" className={mode === 'register' ? 'actif' : ''} onClick={() => setMode('register')}>Créer un compte</button>
        </div>

        {mode === 'register' && (
          <label className="champ">Nom ou pseudo<input type="text" value={f.nom} onChange={set('nom')} required minLength={2} autoComplete="name" /></label>
        )}
        <label className="champ">E-mail<input type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
        <label className="champ">Mot de passe<input type="password" value={f.password} onChange={set('password')} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>

        {mode === 'register' && (
          <>
            <div className="filtres">
              <label className="champ">Je suis
                <select value={f.role} onChange={set('role')}>
                  <option value="eleve">Élève</option>
                  <option value="enseignant">Enseignant</option>
                </select>
              </label>
              <label className="champ">Série
                <select value={f.serie} onChange={set('serie')}>
                  {['A', 'C', 'D', 'L', 'S', 'OSE'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {f.role === 'enseignant' && (
              <label className="champ">Code enseignant<input type="text" value={f.codeEnseignant} onChange={set('codeEnseignant')} required /></label>
            )}
          </>
        )}

        {err && <p className="note note-err" role="alert">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
      </form>
    </div>
  );
}
