import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { CHAMADOS_MOCK } from './data';
import type { ChamadoMock } from './types';

type ChamadosContextValue = {
  chamados: ChamadoMock[];
  setChamados: Dispatch<SetStateAction<ChamadoMock[]>>;
};

const ChamadosContext = createContext<ChamadosContextValue | null>(null);

/**
 * Estado compartilhado dos chamados de expedição no protótipo — o que quem abriu
 * escreve em "Abrir chamado" aparece em "Trabalhar chamado" e vice-versa.
 */
export function ChamadosProvider({ children }: { children: ReactNode }) {
  const [chamados, setChamados] = useState<ChamadoMock[]>(() =>
    CHAMADOS_MOCK.map((c) => ({ ...c, observacoes: [...c.observacoes] })),
  );
  const value = useMemo(() => ({ chamados, setChamados }), [chamados]);
  return <ChamadosContext.Provider value={value}>{children}</ChamadosContext.Provider>;
}

export function useChamados() {
  const ctx = useContext(ChamadosContext);
  if (!ctx) throw new Error('useChamados fora do ChamadosProvider');
  return ctx;
}
