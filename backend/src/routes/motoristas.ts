import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../plugins/auth.js';
import { normalizePhone } from '../utils/phone.js';

const motoristaSchema = z.object({
  nome: z.string().min(2).max(120),
  telefone: z
    .string()
    .min(10)
    .max(20)
    .transform(normalizePhone)
    .refine((v) => /^\d{10,15}$/.test(v), {
      message: 'Telefone deve estar no formato E.164 só com dígitos (ex: 5511987654321)',
    }),
  placa: z.string().max(10).optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function motoristaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/motoristas', async () => {
    return prisma.motorista.findMany({ orderBy: { nome: 'asc' } });
  });

  app.post('/motoristas', async (request, reply) => {
    const body = motoristaSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const exists = await prisma.motorista.findUnique({
      where: { telefone: body.data.telefone },
    });
    if (exists) {
      return reply.status(409).send({ error: 'Telefone já cadastrado' });
    }

    return prisma.motorista.create({
      data: {
        nome: body.data.nome,
        telefone: body.data.telefone,
        placa: body.data.placa || null,
        ativo: body.data.ativo ?? true,
      },
    });
  });

  app.patch('/motoristas/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = motoristaSchema.partial().safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const current = await prisma.motorista.findUnique({ where: { id } });
    if (!current) {
      return reply.status(404).send({ error: 'Motorista não encontrado' });
    }

    if (body.data.telefone && body.data.telefone !== current.telefone) {
      const conflict = await prisma.motorista.findUnique({
        where: { telefone: body.data.telefone },
      });
      if (conflict) {
        return reply.status(409).send({ error: 'Telefone já cadastrado' });
      }
    }

    return prisma.motorista.update({
      where: { id },
      data: body.data,
    });
  });
}
