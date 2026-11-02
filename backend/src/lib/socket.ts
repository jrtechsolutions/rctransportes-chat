import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from './jwt.js';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      if (!token) {
        return next(new Error('Não autorizado'));
      }
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Não autorizado'));
    }
  });

  io.on('connection', (socket) => {
    const setorIds: string[] = socket.handshake.auth?.setorIds ?? [];
    for (const setorId of setorIds) {
      void socket.join(`setor:${setorId}`);
    }
    if (socket.data.user?.papel === 'supervisor') {
      void socket.join('supervisores');
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io não inicializado');
  }
  return io;
}

/** Broadcast para todos os sockets autenticados (ex.: painel de TV da expedição). */
export function emitToAll(event: string, payload: unknown) {
  if (!io) return;
  io.emit(event, payload);
}

export function emitToSetor(setorId: string | null | undefined, event: string, payload: unknown) {
  if (!io) return;
  if (setorId) {
    io.to(`setor:${setorId}`).emit(event, payload);
  }
  io.to('supervisores').emit(event, payload);
}
