import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { Setor } from '../types';

/** Lê sempre a tabela `setores` do banco (mesma fonte da tela Setores). */
export function useSetoresFromDb() {
  const location = useLocation();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Setor[]>('/setores');
      setSetores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar setores');
      setSetores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, location.key]);

  return { setores, loading, error, reload };
}
