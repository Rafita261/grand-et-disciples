import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const session = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };
  const value = {
    user,
    ready,
    setUser,
    login: async (email, password) => session(await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (body) => session(await api('/auth/register', { method: 'POST', body })),
    logout: () => {
      setToken(null);
      setUser(null);
      navigator.serviceWorker?.controller?.postMessage('clear-data');
    },
    estEnseignant: user && user.role !== 'eleve',
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
