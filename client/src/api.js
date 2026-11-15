const KEY = 'ged_token';

export const getToken = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : la session durera le temps de la visite */
  }
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Connexion impossible. Vérifie ton réseau.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    if (res.status === 401 && token && !path.startsWith('/auth/')) {
      setToken(null);
      window.location.assign('/connexion');
    }
    throw err;
  }
  return data;
}

export const ilYA = (date) => {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `il y a ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  const j = Math.round(s / 86400);
  return j < 30 ? `il y a ${j} jour${j > 1 ? 's' : ''}` : new Date(date).toLocaleDateString('fr-FR');
};

export const duree = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}` : `${min} min`);
