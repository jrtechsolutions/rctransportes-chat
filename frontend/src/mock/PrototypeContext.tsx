import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ALL_TELA_IDS, TELA_ROTA, USUARIOS_SELETOR } from './data';
import type { TelaId, UsuarioMock } from './types';

type PrototypeContextValue = {
  loggedIn: boolean;
  usuario: UsuarioMock;
  setUsuarioId: (id: string) => void;
  login: () => void;
  logout: () => void;
  hasTela: (tela: TelaId) => boolean;
  homePath: string;
  usuariosSeletor: UsuarioMock[];
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

const STORAGE_KEY = 'rc-prototype-user';
const LOGIN_KEY = 'rc-prototype-logged';

const DEFAULT_USER_ID = 'u-carlos';

function loadUserId(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && USUARIOS_SELETOR.some((u) => u.id === saved)) return saved;
  return DEFAULT_USER_ID;
}

function resolveTelas(u: UsuarioMock): TelaId[] {
  return u.admin ? ALL_TELA_IDS : u.telas;
}

function firstAllowedPath(u: UsuarioMock): string {
  const telas = resolveTelas(u);
  for (const t of telas) {
    if (TELA_ROTA[t]) return TELA_ROTA[t];
  }
  return '/atendimento';
}

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(LOGIN_KEY) === '1');
  const [usuarioId, setUsuarioIdState] = useState(loadUserId);

  const usuario = useMemo(
    () => USUARIOS_SELETOR.find((u) => u.id === usuarioId) ?? USUARIOS_SELETOR[0],
    [usuarioId],
  );

  const setUsuarioId = useCallback((id: string) => {
    setUsuarioIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const login = useCallback(() => {
    setLoggedIn(true);
    localStorage.setItem(LOGIN_KEY, '1');
    if (!localStorage.getItem(STORAGE_KEY)) {
      setUsuarioIdState(DEFAULT_USER_ID);
      localStorage.setItem(STORAGE_KEY, DEFAULT_USER_ID);
    }
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    localStorage.removeItem(LOGIN_KEY);
  }, []);

  const telas = useMemo(() => resolveTelas(usuario), [usuario]);

  const hasTela = useCallback((tela: TelaId) => telas.includes(tela), [telas]);

  const homePath = useMemo(() => firstAllowedPath(usuario), [usuario]);

  const value = useMemo(
    () => ({
      loggedIn,
      usuario,
      setUsuarioId,
      login,
      logout,
      hasTela,
      homePath,
      usuariosSeletor: USUARIOS_SELETOR,
    }),
    [loggedIn, usuario, setUsuarioId, login, logout, hasTela, homePath],
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error('usePrototype fora do PrototypeProvider');
  return ctx;
}
