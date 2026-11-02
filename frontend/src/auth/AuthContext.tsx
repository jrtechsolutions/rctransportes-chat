import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  clearTokens,
  getAccessToken,
  getLastActivity,
  getRefreshToken,
  INACTIVITY_MS,
  setTokens,
  touchActivity,
} from '../lib/api';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loginWithMicrosoft: () => void;
  loginDev: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOAuth: (access: string, refresh: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await api<User>('/auth/me');
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  }, []);

  const completeOAuth = useCallback(
    async (access: string, refresh: string) => {
      setTokens(access, refresh);
      await refreshUser();
    },
    [refreshUser],
  );

  const loginWithMicrosoft = useCallback(() => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/microsoft`;
  }, []);

  const loginDev = useCallback(
    async (email: string, password: string) => {
      const data = await api<{ accessToken: string; refreshToken: string }>('/auth/dev-login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      setTokens(data.accessToken, data.refreshToken);
      await refreshUser();
    },
    [refreshUser],
  );

  useEffect(() => {
    const boot = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, [refreshUser]);

  // Inatividade
  useEffect(() => {
    if (!user) return;

    const onActivity = () => touchActivity();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);

    const timer = setInterval(() => {
      const last = getLastActivity();
      if (last && Date.now() - last > INACTIVITY_MS) {
        void logout();
      }
    }, 60_000);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      clearInterval(timer);
    };
  }, [user, logout]);

  const value = useMemo(
    () => ({ user, loading, loginWithMicrosoft, loginDev, logout, completeOAuth, refreshUser }),
    [user, loading, loginWithMicrosoft, loginDev, logout, completeOAuth, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
