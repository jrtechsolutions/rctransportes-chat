import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'rc-atendimento-api',
    timestamp: new Date().toISOString(),
  }));
}
