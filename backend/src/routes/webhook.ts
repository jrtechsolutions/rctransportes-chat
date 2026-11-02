import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { verifyMetaSignature } from '../utils/crypto.js';
import { processWhatsAppPayload } from '../services/webhook-processor.js';

export async function webhookRoutes(app: FastifyInstance) {
  app.get(
    '/webhook/whatsapp',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const q = request.query as Record<string, string>;
      const mode = q['hub.mode'];
      const token = q['hub.verify_token'];
      const challenge = q['hub.challenge'];

      if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
        return reply.status(200).send(challenge);
      }
      return reply.status(403).send('Forbidden');
    },
  );

  app.post(
    '/webhook/whatsapp',
    {
      config: {
        rateLimit: { max: 200, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      // Responder 200 imediatamente — Meta reenvia se não receber rápido
      void reply.status(200).send({ ok: true });

      const rawBody =
        (request as { rawBody?: string }).rawBody ??
        JSON.stringify(request.body ?? {});
      const signature = request.headers['x-hub-signature-256'] as string | undefined;

      if (env.WHATSAPP_APP_SECRET) {
        if (!verifyMetaSignature(rawBody, signature, env.WHATSAPP_APP_SECRET)) {
          console.warn('[webhook] assinatura inválida — payload descartado');
          return;
        }
      }

      setImmediate(() => {
        void processWhatsAppPayload(request.body);
      });
    },
  );
}
