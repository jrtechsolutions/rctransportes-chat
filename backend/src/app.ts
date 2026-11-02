import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { webhookRoutes } from './routes/webhook.js';
import { atendimentoRoutes } from './routes/atendimentos.js';
import { motoristaRoutes } from './routes/motoristas.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { setorRoutes } from './routes/setores.js';
import { numeroWhatsappRoutes } from './routes/numeros-whatsapp.js';
import { chamadoRoutes } from './routes/chamados.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    // Necessário para validar X-Hub-Signature-256
    bodyLimit: 1_048_576,
  });

  // Captura body bruto para o webhook do WhatsApp
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      try {
        const raw = body as string;
        (req as { rawBody?: string }).rawBody = raw;
        const json = raw.length ? JSON.parse(raw) : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await app.register(rateLimit, {
    global: false,
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(webhookRoutes);
  await app.register(atendimentoRoutes);
  await app.register(motoristaRoutes);
  await app.register(usuarioRoutes);
  await app.register(numeroWhatsappRoutes);
  await app.register(setorRoutes);
  await app.register(chamadoRoutes);

  return app;
}
