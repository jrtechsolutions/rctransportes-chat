import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireSupervisor } from '../plugins/auth.js';

const USO_LABEL: Record<string, string> = {
  clientes: 'Clientes',
  motorista: 'Motorista',
};

const setorBodySchema = z.object({
  nome: z.string().min(2).max(80),
  numeroWhatsappId: z.string().min(1),
  slaMinutos: z.number().int().min(1).max(24 * 60).optional(),
});

type NumeroRow = { id: string; uso: 'clientes' | 'motorista'; phoneNumberId: string };

function serializeSetor(s: {
  id: string;
  nome: string;
  slaMinutos: number;
  numeroWhatsappId: string | null;
  numeroWhatsapp: NumeroRow | null;
}) {
  return {
    id: s.id,
    nome: s.nome,
    slaMinutos: s.slaMinutos,
    numeroWhatsappId: s.numeroWhatsappId,
    numeroWhatsapp: s.numeroWhatsapp
      ? {
          id: s.numeroWhatsapp.id,
          uso: s.numeroWhatsapp.uso,
          label: USO_LABEL[s.numeroWhatsapp.uso] ?? s.numeroWhatsapp.uso,
          phoneNumberId: s.numeroWhatsapp.phoneNumberId,
        }
      : null,
  };
}

/**
 * Comercial/Financeiro → sempre Clientes.
 * Operacional → sempre Motorista.
 * Demais setores: aceita o número informado, desde que exista na tabela.
 */
async function assertNumeroPermitidoParaSetor(
  nome: string,
  numeroWhatsappId: string,
): Promise<{ ok: true; numero: NumeroRow } | { ok: false; error: string }> {
  const numero = await prisma.numeroWhatsapp.findUnique({ where: { id: numeroWhatsappId } });
  if (!numero) {
    return {
      ok: false,
      error: 'numeroWhatsappId inválido. Escolha um dos números cadastrados em Números de WhatsApp.',
    };
  }

  const nomeNorm = nome.trim().toLowerCase();
  if (nomeNorm === 'comercial' || nomeNorm === 'financeiro') {
    if (numero.uso !== 'clientes') {
      return {
        ok: false,
        error: 'Comercial e Financeiro devem usar o número Clientes (compartilhado).',
      };
    }
  }
  if (nomeNorm === 'operacional' && numero.uso !== 'motorista') {
    return {
      ok: false,
      error: 'Operacional deve usar o número Motorista.',
    };
  }
  if (numero.uso === 'motorista' && nomeNorm !== 'operacional') {
    return {
      ok: false,
      error: 'O número Motorista é dedicado ao setor Operacional.',
    };
  }

  return { ok: true, numero };
}

export async function setorRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/setores', async (request) => {
    const user = request.user!;
    const rows =
      user.papel === 'supervisor'
        ? await prisma.setor.findMany({
            include: { numeroWhatsapp: true },
            orderBy: { nome: 'asc' },
          })
        : await prisma.setor.findMany({
            where: { id: { in: user.setorIds } },
            include: { numeroWhatsapp: true },
            orderBy: { nome: 'asc' },
          });

    return rows.map(serializeSetor);
  });

  app.post('/setores', async (request, reply) => {
    await requireSupervisor(request, reply);
    if (reply.sent) return;

    const body = setorBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const nome = body.data.nome.trim();
    const check = await assertNumeroPermitidoParaSetor(nome, body.data.numeroWhatsappId);
    if (!check.ok) {
      return reply.status(400).send({ error: check.error });
    }

    const exists = await prisma.setor.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' } },
    });
    if (exists) {
      return reply.status(409).send({ error: 'Já existe um setor com este nome' });
    }

    const created = await prisma.setor.create({
      data: {
        nome,
        numeroWhatsappId: body.data.numeroWhatsappId,
        slaMinutos: body.data.slaMinutos ?? 15,
      },
      include: { numeroWhatsapp: true },
    });

    return serializeSetor(created);
  });

  app.put('/setores/:id', async (request, reply) => {
    await requireSupervisor(request, reply);
    if (reply.sent) return;

    const { id } = request.params as { id: string };
    const body = setorBodySchema.partial().safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const current = await prisma.setor.findUnique({ where: { id } });
    if (!current) {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    const nome = body.data.nome?.trim() ?? current.nome;
    const numeroWhatsappId = body.data.numeroWhatsappId ?? current.numeroWhatsappId;
    if (!numeroWhatsappId) {
      return reply.status(400).send({ error: 'numeroWhatsappId é obrigatório' });
    }

    const check = await assertNumeroPermitidoParaSetor(nome, numeroWhatsappId);
    if (!check.ok) {
      return reply.status(400).send({ error: check.error });
    }

    if (body.data.nome) {
      const conflict = await prisma.setor.findFirst({
        where: {
          nome: { equals: nome, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (conflict) {
        return reply.status(409).send({ error: 'Já existe um setor com este nome' });
      }
    }

    const updated = await prisma.setor.update({
      where: { id },
      data: {
        nome: body.data.nome?.trim(),
        numeroWhatsappId,
        slaMinutos: body.data.slaMinutos,
      },
      include: { numeroWhatsapp: true },
    });

    return serializeSetor(updated);
  });

  /** Compatível com a tela de SLA */
  app.patch('/setores/:id/sla', async (request, reply) => {
    await requireSupervisor(request, reply);
    if (reply.sent) return;

    const { id } = request.params as { id: string };
    const body = z
      .object({ slaMinutos: z.number().int().min(1).max(24 * 60) })
      .safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({ error: 'slaMinutos inválido' });
    }

    const setor = await prisma.setor.findUnique({
      where: { id },
      include: { numeroWhatsapp: true },
    });
    if (!setor) {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    const updated = await prisma.setor.update({
      where: { id },
      data: { slaMinutos: body.data.slaMinutos },
      include: { numeroWhatsapp: true },
    });

    return serializeSetor(updated);
  });
}
