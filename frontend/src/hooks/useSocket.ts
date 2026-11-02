import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL, getAccessToken } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

const EVENTOS_ATENDIMENTO = ['atendimento:updated', 'mensagem:nova'];

export const EVENTOS_CHAMADO = ['chamado:novo', 'chamado:atualizado'];

export function useSocket(
  onEvent: (event: string, payload: unknown) => void,
  events: string[] = EVENTOS_ATENDIMENTO,
) {
  const { user } = useAuth();
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const eventsKey = events.join('|');

  useEffect(() => {
    if (!user) return;

    const setorIds = user.setores.map((s) => s.id);
    // Função em vez de objeto: cada reconexão usa o access token mais recente (renovado pelo refresh).
    const socket: Socket = io(API_URL, {
      auth: (cb) => cb({ token: getAccessToken(), setorIds }),
    });

    for (const ev of eventsKey.split('|')) {
      socket.on(ev, (payload) => handler.current(ev, payload));
    }

    return () => {
      socket.disconnect();
    };
  }, [user, eventsKey]);
}
