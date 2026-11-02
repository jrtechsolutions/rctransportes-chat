import type { FastifyInstance } from 'fastify';
import {
  ConfidentialClientApplication,
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
} from '@azure/msal-node';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import {
  createRefreshTokenValue,
  refreshTokenExpiresAt,
  signAccessToken,
} from '../lib/jwt.js';
import { authenticate } from '../plugins/auth.js';

function createMsalClient() {
  if (!env.MS_CLIENT_ID || !env.MS_TENANT_ID || !env.MS_CLIENT_SECRET) {
    return null;
  }
  return new ConfidentialClientApplication({
    auth: {
      clientId: env.MS_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${env.MS_TENANT_ID}`,
      clientSecret: env.MS_CLIENT_SECRET,
    },
  });
}

const NO_ACCESS =
  'Seu usuário não tem acesso a esta ferramenta. Fale com seu supervisor.';

async function issueSession(usuario: {
  id: string;
  email: string;
  nome: string;
  papel: 'agente' | 'supervisor';
}) {
  const accessToken = signAccessToken({
    sub: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    papel: usuario.papel,
  });
  const refreshValue = createRefreshTokenValue();
  await prisma.refreshToken.create({
    data: {
      token: refreshValue,
      usuarioId: usuario.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });
  const setores = await prisma.usuarioSetor.findMany({
    where: { usuarioId: usuario.id },
  });
  return {
    accessToken,
    refreshToken: refreshValue,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      setorIds: setores.map((s) => s.setorId),
    },
  };
}

export async function authRoutes(app: FastifyInstance) {
  const msal = createMsalClient();
  const redirectUri = `${env.BACKEND_URL}/auth/microsoft/callback`;

  app.get('/auth/dev-status', async () => ({
    enabled: env.DEV_LOGIN_ENABLED,
  }));

  app.post(
    '/auth/dev-login',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      if (!env.DEV_LOGIN_ENABLED) {
        return reply.status(404).send({ error: 'Login de desenvolvimento desabilitado' });
      }

      const body = z
        .object({
          email: z.string().email(),
          password: z.string().min(1),
        })
        .safeParse(request.body);

      if (!body.success) {
        return reply.status(400).send({ error: 'Informe e-mail e senha' });
      }

      if (body.data.password !== env.DEV_LOGIN_PASSWORD) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      const email = body.data.email.toLowerCase();
      const usuario = await prisma.usuario.findUnique({ where: { email } });

      if (!usuario || !usuario.ativo) {
        return reply.status(401).send({ error: NO_ACCESS });
      }

      return issueSession(usuario);
    },
  );

  app.get(
    '/auth/microsoft',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
    },
    async (_request, reply) => {
      if (!msal) {
        return reply.status(503).send({
          error:
            'Autenticação Microsoft não configurada. Defina MS_CLIENT_ID, MS_CLIENT_SECRET e MS_TENANT_ID.',
        });
      }

      const authUrlRequest: AuthorizationUrlRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        redirectUri,
      };

      const url = await msal.getAuthCodeUrl(authUrlRequest);
      return reply.redirect(url);
    },
  );

  app.get('/auth/microsoft/callback', async (request, reply) => {
    if (!msal) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=ms_not_configured`);
    }

    const query = request.query as { code?: string; error?: string };
    if (query.error || !query.code) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_denied`);
    }

    try {
      const tokenRequest: AuthorizationCodeRequest = {
        code: query.code,
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        redirectUri,
      };
      const result = await msal.acquireTokenByCode(tokenRequest);
      const oid = result.account?.homeAccountId?.split('.')[0] ?? result.uniqueId;
      const email = (
        result.account?.username ??
        (result.idTokenClaims as { preferred_username?: string; email?: string } | undefined)
          ?.preferred_username ??
        (result.idTokenClaims as { email?: string } | undefined)?.email ??
        ''
      ).toLowerCase();

      if (!email) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=no_email`);
      }

      let usuario = oid
        ? await prisma.usuario.findUnique({ where: { microsoftOid: oid } })
        : null;

      if (!usuario) {
        usuario = await prisma.usuario.findUnique({ where: { email } });
      }

      if (!usuario || !usuario.ativo) {
        return reply.redirect(
          `${env.FRONTEND_URL}/login?error=${encodeURIComponent(NO_ACCESS)}`,
        );
      }

      if (oid && !usuario.microsoftOid) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { microsoftOid: oid },
        });
      }

      const session = await issueSession(usuario);
      const params = new URLSearchParams({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });
      return reply.redirect(`${env.FRONTEND_URL}/auth/callback?${params.toString()}`);
    } catch (err) {
      console.error('[auth] callback error', err);
      return reply.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }
  });

  app.post(
    '/auth/refresh',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const body = z.object({ refreshToken: z.string().min(1) }).safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'refreshToken obrigatório' });
      }

      const stored = await prisma.refreshToken.findUnique({
        where: { token: body.data.refreshToken },
        include: { usuario: { include: { setores: true } } },
      });

      if (!stored || stored.expiresAt < new Date() || !stored.usuario.ativo) {
        if (stored) {
          await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
        }
        return reply.status(401).send({ error: NO_ACCESS });
      }

      const accessToken = signAccessToken({
        sub: stored.usuario.id,
        email: stored.usuario.email,
        nome: stored.usuario.nome,
        papel: stored.usuario.papel,
      });

      return {
        accessToken,
        user: {
          id: stored.usuario.id,
          nome: stored.usuario.nome,
          email: stored.usuario.email,
          papel: stored.usuario.papel,
          setorIds: stored.usuario.setores.map((s) => s.setorId),
        },
      };
    },
  );

  app.post('/auth/logout', { preHandler: authenticate }, async (request, reply) => {
    const body = z.object({ refreshToken: z.string().optional() }).safeParse(request.body);
    if (body.success && body.data.refreshToken) {
      await prisma.refreshToken
        .deleteMany({ where: { token: body.data.refreshToken } })
        .catch(() => undefined);
    } else if (request.user) {
      await prisma.refreshToken.deleteMany({ where: { usuarioId: request.user.sub } });
    }
    return reply.send({ ok: true });
  });

  app.get('/auth/me', { preHandler: authenticate }, async (request) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.user!.sub },
      include: {
        setores: { include: { setor: true } },
      },
    });

    return {
      id: usuario!.id,
      nome: usuario!.nome,
      email: usuario!.email,
      papel: usuario!.papel,
      setores: usuario!.setores.map((s) => ({
        id: s.setor.id,
        nome: s.setor.nome,
      })),
    };
  });
}
