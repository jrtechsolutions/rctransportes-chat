import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireSupervisor } from '../plugins/auth.js';

const USO_LABEL: Record<string, string> = {
  clientes: 'Clientes',
  motorista: 'Motorista',
};

const updateSchema = z.object({
  phoneNumberId: z.string().min(1).max(120),
});

function serialize(n: { id: string; uso: string; phoneNumberId: string }) {
  return {
    id: n.id,
    uso: n.uso,
    label: USO_LABEL[n.uso] ?? n.uso,
    phoneNumberId: n.phoneNumberId,
    descricao:
      n.uso === 'clientes'
        ? 'único, compartilhado entre setores'
        : 'dedicado, só Operacional',
  };
}

export async function numeroWhatsappRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireSupervisor);

  app.get('/numeros-whatsapp', async () => {
    const rows = await prisma.numeroWhatsapp.findMany({
      orderBy: { uso: 'asc' },
    });
    return rows.map(serialize);
  });

  app.put('/numeros-whatsapp/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'phoneNumberId inválido' });
    }

    const current = await prisma.numeroWhatsapp.findUnique({ where: { id } });
    if (!current) {
      return reply.status(404).send({ error: 'Número de WhatsApp não encontrado' });
    }

    const updated = await prisma.numeroWhatsapp.update({
      where: { id },
      data: { phoneNumberId: body.data.phoneNumberId.trim() },
    });

    return serialize(updated);
  });
}
