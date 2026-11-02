import type { FastifyInstance } from 'fastify';
import type { Prisma, StatusChamado } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../plugins/auth.js';
import { emitToAll } from '../lib/socket.js';
import { AiExtracaoError, extrairCamposChamado } from '../services/ai-extracao.js';
import { enviarEmailChamadoResolvido } from '../services/email.js';
import { sanitizeOptional, sanitizeText } from '../utils/sanitize.js';

const STATUS = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'] as const;

const texto = (max: number) => z.string().transform(sanitizeText).pipe(z.string().min(1).max(max));

const criarSchema = z.object({
  clienteNome: texto(200),
  clienteEmail: z.string().trim().toLowerCase().email().max(254),
  destino: texto(200),
  notaFiscal: z
    .string()
    .max(60)
    .optional()
    .nullable()
    .transform((v) => sanitizeOptional(v)),
  tipoVeiculo: texto(100),
  peso: texto(60),
  horarioLimite: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm'),
  textoEmail: texto(50_000),
});

const listInclude = {
  criadoPor: { select: { id: true, nome: true } },
  assumidoPor: { select: { id: true, nome: true } },
  _count: { select: { observacoes: true } },
} satisfies Prisma.ChamadoInclude;

const listOmit = { emailOriginalTexto: true, emailConfirmacaoErro: true } satisfies Prisma.ChamadoOmit;

async function findListItem(id: string) {
  return prisma.chamado.findUnique({ where: { id }, include: listInclude, omit: listOmit });
}

async function enviarConfirmacao(id: string) {
  const chamado = await prisma.chamado.findUniqueOrThrow({
    where: { id },
    include: { criadoPor: { select: { nome: true, email: true } } },
  });

  try {
    await enviarEmailChamadoResolvido(chamado);
    await prisma.chamado.update({
      where: { id },
      data: { emailConfirmacaoEnviadoEm: new Date(), emailConfirmacaoErro: null },
    });
    return { emailEnviado: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[chamados] falha ao enviar e-mail de confirmação do chamado ${id}`, err);
    await prisma.chamado.update({
      where: { id },
      data: { emailConfirmacaoErro: message.slice(0, 500) },
    });
    return { emailEnviado: false as const, emailErro: 'Não foi possível enviar o e-mail de confirmação.' };
  }
}

export async function chamadoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post(
    '/chamados/extrair-ia',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = z
        .object({ textoEmail: z.string().trim().min(1).max(50_000) })
        .safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Cole o texto do e-mail antes de extrair.' });
      }

      try {
        return await extrairCamposChamado(body.data.textoEmail);
      } catch (err) {
        if (err instanceof AiExtracaoError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.post('/chamados', async (request, reply) => {
    const body = criarSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Preencha todos os campos obrigatórios corretamente.' });
    }

    const { textoEmail, ...campos } = body.data;
    const created = await prisma.chamado.create({
      data: {
        ...campos,
        emailOriginalTexto: textoEmail,
        criadoPorId: request.user!.sub,
      },
      include: listInclude,
      omit: listOmit,
    });

    emitToAll('chamado:novo', created);
    return reply.status(201).send(created);
  });

  app.get('/chamados', async (request, reply) => {
    const q = z
      .object({
        status: z
          .string()
          .optional()
          .transform((v) => (v ? v.split(',').map((s) => s.trim()) : undefined))
          .pipe(z.array(z.enum(STATUS)).optional()),
        emailPendente: z
          .enum(['true', 'false'])
          .optional()
          .transform((v) => v === 'true'),
      })
      .safeParse(request.query);
    if (!q.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos' });
    }

    const where: Prisma.ChamadoWhereInput = {};
    if (q.data.emailPendente) {
      where.status = 'RESOLVIDO';
      where.emailConfirmacaoEnviadoEm = null;
    } else if (q.data.status) {
      where.status = { in: q.data.status as StatusChamado[] };
    }

    return prisma.chamado.findMany({
      where,
      include: listInclude,
      omit: listOmit,
      orderBy: { criadoEm: 'desc' },
      take: 300,
    });
  });

  app.get('/chamados/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const chamado = await prisma.chamado.findUnique({
      where: { id },
      omit: { emailConfirmacaoErro: true },
      include: {
        criadoPor: { select: { id: true, nome: true, email: true } },
        assumidoPor: { select: { id: true, nome: true } },
        observacoes: {
          include: { autor: { select: { id: true, nome: true } } },
          orderBy: { criadoEm: 'asc' },
        },
      },
    });
    if (!chamado) {
      return reply.status(404).send({ error: 'Chamado não encontrado' });
    }
    return chamado;
  });

  app.patch('/chamados/:id/assumir', async (request, reply) => {
    const { id } = request.params as { id: string };
    const chamado = await prisma.chamado.findUnique({ where: { id } });
    if (!chamado) {
      return reply.status(404).send({ error: 'Chamado não encontrado' });
    }
    if (chamado.status === 'RESOLVIDO') {
      return reply.status(400).send({ error: 'Chamado já resolvido' });
    }

    const updated = await prisma.chamado.update({
      where: { id },
      data: { status: 'EM_ANDAMENTO', assumidoPorId: request.user!.sub },
      include: listInclude,
      omit: listOmit,
    });

    emitToAll('chamado:atualizado', updated);
    return updated;
  });

  app.post('/chamados/:id/observacoes', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({ texto: texto(4000) }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Escreva a observação antes de salvar.' });
    }

    const chamado = await prisma.chamado.findUnique({ where: { id }, select: { id: true } });
    if (!chamado) {
      return reply.status(404).send({ error: 'Chamado não encontrado' });
    }

    const observacao = await prisma.chamadoObservacao.create({
      data: { chamadoId: id, autorId: request.user!.sub, texto: body.data.texto },
      include: { autor: { select: { id: true, nome: true } } },
    });

    const item = await findListItem(id);
    emitToAll('chamado:atualizado', item);
    return reply.status(201).send(observacao);
  });

  app.patch('/chamados/:id/resolver', async (request, reply) => {
    const { id } = request.params as { id: string };
    const chamado = await prisma.chamado.findUnique({ where: { id } });
    if (!chamado) {
      return reply.status(404).send({ error: 'Chamado não encontrado' });
    }

    // Transição condicional: evita e-mail duplicado se duas pessoas resolverem ao mesmo tempo.
    const { count } = await prisma.chamado.updateMany({
      where: { id, status: { not: 'RESOLVIDO' } },
      data: {
        status: 'RESOLVIDO',
        resolvidoEm: new Date(),
        assumidoPorId: chamado.assumidoPorId ?? request.user!.sub,
      },
    });
    if (count === 0) {
      return reply.status(400).send({ error: 'Chamado já resolvido' });
    }

    emitToAll('chamado:atualizado', await findListItem(id));

    const resultado = await enviarConfirmacao(id);
    const updated = await findListItem(id);
    emitToAll('chamado:atualizado', updated);

    return { chamado: updated, ...resultado };
  });

  app.post(
    '/chamados/:id/reenviar-email',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const chamado = await prisma.chamado.findUnique({ where: { id }, select: { status: true } });
      if (!chamado) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }
      if (chamado.status !== 'RESOLVIDO') {
        return reply.status(400).send({ error: 'Só é possível reenviar o e-mail de chamados resolvidos' });
      }

      const resultado = await enviarConfirmacao(id);
      const updated = await findListItem(id);
      emitToAll('chamado:atualizado', updated);
      return { chamado: updated, ...resultado };
    },
  );
}
