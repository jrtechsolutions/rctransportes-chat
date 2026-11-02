import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload & { ativo: boolean; setorIds: string[] };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Não autenticado' });
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { setores: true },
    });

    if (!usuario || !usuario.ativo) {
      return reply.status(401).send({
        error: 'Seu usuário não tem acesso a esta ferramenta. Fale com seu supervisor.',
      });
    }

    request.user = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      ativo: usuario.ativo,
      setorIds: usuario.setores.map((s) => s.setorId),
    };
  } catch {
    return reply.status(401).send({ error: 'Sessão inválida ou expirada' });
  }
}

export async function requireSupervisor(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.papel !== 'supervisor') {
    return reply.status(403).send({ error: 'Acesso restrito a supervisores' });
  }
}

export function canAccessSetor(request: FastifyRequest, setorId: string | null | undefined): boolean {
  if (!request.user) return false;
  if (request.user.papel === 'supervisor') return true;
  if (!setorId) return false;
  return request.user.setorIds.includes(setorId);
}
