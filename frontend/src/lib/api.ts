const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ACCESS_KEY = 'rc_access_token';
const REFRESH_KEY = 'rc_refresh_token';
const LAST_ACTIVITY_KEY = 'rc_last_activity';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  touchActivity();
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function touchActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getLastActivity(): number {
  return Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
}

/** Logout por inatividade: 30 minutos */
export const INACTIVITY_MS = 30 * 60 * 1000;

type ApiOptions = RequestInit & { auth?: boolean };

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const h = new Headers(headers);

  if (auth) {
    const token = getAccessToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
  }

  if (rest.body && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json');
  }

  let res = await fetch(`${API_URL}${path}`, { ...rest, headers: h, credentials: 'include' });

  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      h.set('Authorization', `Bearer ${getAccessToken()}`);
      res = await fetch(`${API_URL}${path}`, { ...rest, headers: h, credentials: 'include' });
    }
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (typeof data.error === 'string') message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const data = await api<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ refreshToken: refresh }),
    });
    setTokens(data.accessToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function microsoftLoginUrl() {
  return `${API_URL}/auth/microsoft`;
}

export { API_URL };
