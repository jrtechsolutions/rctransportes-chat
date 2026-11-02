import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import type { User } from '../types';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { completeOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (!access || !refresh) {
      navigate('/login?error=auth_failed', { replace: true });
      return;
    }
    void completeOAuth(access, refresh)
      .then(async () => {
        const me = await api<User>('/auth/me');
        navigate(me.papel === 'supervisor' ? '/supervisor' : '/fila', { replace: true });
      })
      .catch(() => navigate('/login?error=auth_failed', { replace: true }));
  }, [params, completeOAuth, navigate]);

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <p>Concluindo login…</p>
    </div>
  );
}
