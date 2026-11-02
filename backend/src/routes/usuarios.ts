import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireSupervisor } from '../plugins/auth.js';

const usuarioSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().transform((e) => e.toLowerCase()),
  papel: z.enum(['agente', 'supervisor']),
  setorIds: z.array(z.string()).default([]),
  ativo: z.boolean().optional(),
});

export async function usuarioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireSupervisor);

  app.get('/usuarios', async () => {
    const rows = await prisma.usuario.findMany({
      include: {
        setores: { include: { setor: true } },
      },
      orderBy: { nome: 'asc' },
    });
    return rows.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      ativo: u.ativo,
      microsoftOid: u.microsoftOid,
      setores: u.setores.map((s) => ({ id: s.setor.id, nome: s.setor.nome })),
    }));
  });

  app.post('/usuarios', async (request, reply) => {
    const body = usuarioSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const exists = await prisma.usuario.findUnique({ where: { email: body.data.email } });
    if (exists) {
      return reply.status(409).send({ error: 'E-mail já cadastrado' });
    }

    if (body.data.setorIds.length > 0) {
      const found = await prisma.setor.findMany({
        where: { id: { in: body.data.setorIds } },
        select: { id: true },
      });
      if (found.length !== body.data.setorIds.length) {
        return reply.status(400).send({
          error: 'Um ou mais setores informados não existem. Cadastre-os em Setores primeiro.',
        });
      }
    }

    const usuario = await prisma.usuario.create({
      data: {
        nome: body.data.nome,
        email: body.data.email,
        papel: body.data.papel,
        ativo: body.data.ativo ?? true,
        setores: {
          create: body.data.setorIds.map((setorId) => ({ setorId })),
        },
      },
      include: { setores: { include: { setor: true } } },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      ativo: usuario.ativo,
      setores: usuario.setores.map((s) => ({ id: s.setor.id, nome: s.setor.nome })),
    };
  });

  app.patch('/usuarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = usuarioSchema.partial().safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const current = await prisma.usuario.findUnique({ where: { id } });
    if (!current) {
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }

    if (body.data.email && body.data.email !== current.email) {
      const conflict = await prisma.usuario.findUnique({ where: { email: body.data.email } });
      if (conflict) {
        return reply.status(409).send({ error: 'E-mail já cadastrado' });
      }
    }

    if (body.data.setorIds && body.data.setorIds.length > 0) {
      const found = await prisma.setor.findMany({
        where: { id: { in: body.data.setorIds } },
        select: { id: true },
      });
      if (found.length !== body.data.setorIds.length) {
        return reply.status(400).send({
          error: 'Um ou mais setores informados não existem. Cadastre-os em Setores primeiro.',
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: {
          nome: body.data.nome,
          email: body.data.email,
          papel: body.data.papel,
          ativo: body.data.ativo,
        },
      });

      if (body.data.setorIds) {
        await tx.usuarioSetor.deleteMany({ where: { usuarioId: id } });
        await tx.usuarioSetor.createMany({
          data: body.data.setorIds.map((setorId) => ({ usuarioId: id, setorId })),
        });
      }

      // Desativar invalida refresh tokens imediatamente
      if (body.data.ativo === false) {
        await tx.refreshToken.deleteMany({ where: { usuarioId: id } });
      }
    });

    const updated = await prisma.usuario.findUnique({
      where: { id },
      include: { setores: { include: { setor: true } } },
    });

    return {
      id: updated!.id,
      nome: updated!.nome,
      email: updated!.email,
      papel: updated!.papel,
      ativo: updated!.ativo,
      setores: updated!.setores.map((s) => ({ id: s.setor.id, nome: s.setor.nome })),
    };
  });
}
