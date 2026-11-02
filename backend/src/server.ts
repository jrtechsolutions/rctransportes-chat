import { buildApp } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './lib/socket.js';
import { processMenuTimeouts } from './services/webhook-processor.js';
import { prisma } from './lib/prisma.js';

async function main() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });

  initSocket(app.server);

  // Job do chatbot de menu (lembrete / timeout)
  const interval = setInterval(() => {
    void processMenuTimeouts().catch((err) => {
      app.log.error(err, 'erro no job de menu timeouts');
    });
  }, 60_000);

  const shutdown = async () => {
    clearInterval(interval);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  app.log.info(`API RC Atendimento em http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
