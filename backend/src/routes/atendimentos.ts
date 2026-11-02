import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, canAccessSetor } from '../plugins/auth.js';
import { emitToSetor } from '../lib/socket.js';
import { env } from '../config/env.js';
import { formatAgentMessage, sendTextMessage } from '../services/whatsapp.js';
import { previewText } from '../utils/phone.js';

export async function atendimentoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/atendimentos', async (request, reply) => {
    const q = z
      .object({
        setorId: z.string().optional(),
        status: z.enum(['aguardando', 'em_atendimento', 'encerrada', 'todas']).optional(),
      })
      .safeParse(request.query);

    if (!q.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos' });
    }

    const user = request.user!;
    const where: Record<string, unknown> = {};

    if (user.papel !== 'supervisor') {
      where.setorId = { in: user.setorIds };
    } else if (q.data.setorId) {
      where.setorId = q.data.setorId;
    }

    if (q.data.status && q.data.status !== 'todas') {
      where.status = q.data.status;
    }

    // Conversas aguardando menu (sem setor) só supervisor vê, ou ninguém na fila de setor
    const rows = await prisma.atendimento.findMany({
      where,
      include: {
        setor: true,
        assumidoPor: { select: { id: true, nome: true } },
      },
      orderBy: [{ status: 'asc' }, { atualizadoEm: 'desc' }],
      take: 200,
    });

    return rows;
  });

  app.get('/atendimentos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
      include: {
        setor: true,
        assumidoPor: { select: { id: true, nome: true } },
        conversaLimpaPor: { select: { id: true, nome: true } },
      },
    });

    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }
    return atendimento;
  });

  app.post('/atendimentos/:id/assumir', async (request, reply) => {
    const { id } = request.params as { id: string };
    const atendimento = await prisma.atendimento.findUnique({ where: { id } });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }
    if (atendimento.status === 'encerrada') {
      return reply.status(400).send({ error: 'Atendimento encerrado' });
    }

    const updated = await prisma.atendimento.update({
      where: { id },
      data: {
        status: 'em_atendimento',
        assumidoPorId: request.user!.sub,
        slaVenceEm: null,
      },
      include: {
        setor: true,
        assumidoPor: { select: { id: true, nome: true } },
      },
    });

    emitToSetor(updated.setorId, 'atendimento:updated', { id: updated.id });
    return updated;
  });

  app.post('/atendimentos/:id/encerrar', async (request, reply) => {
    const { id } = request.params as { id: string };
    const atendimento = await prisma.atendimento.findUnique({ where: { id } });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }
    if (atendimento.tipo === 'conversa') {
      return reply.status(400).send({
        error: 'Conversas de cliente não são encerradas manualmente — use Limpar conversa se necessário.',
      });
    }

    const updated = await prisma.atendimento.update({
      where: { id },
      data: { status: 'encerrada', assumidoPorId: null },
    });

    emitToSetor(updated.setorId, 'atendimento:updated', { id: updated.id });
    return updated;
  });

  app.post('/atendimentos/:id/transferir', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({ paraSetorId: z.string().min(1) }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'paraSetorId obrigatório' });
    }

    const atendimento = await prisma.atendimento.findUnique({ where: { id } });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }
    if (!atendimento.setorId) {
      return reply.status(400).send({ error: 'Atendimento sem setor definido' });
    }
    if (atendimento.setorId === body.data.paraSetorId) {
      return reply.status(400).send({ error: 'Só é possível transferir para outro setor' });
    }

    const paraSetor = await prisma.setor.findUnique({ where: { id: body.data.paraSetorId } });
    if (!paraSetor) {
      return reply.status(404).send({ error: 'Setor destino não encontrado' });
    }

    const deSetorId = atendimento.setorId;

    const [updated] = await prisma.$transaction([
      prisma.atendimento.update({
        where: { id },
        data: {
          setorId: paraSetor.id,
          status: 'aguardando',
          assumidoPorId: null,
          slaVenceEm: new Date(Date.now() + paraSetor.slaMinutos * 60_000),
        },
        include: { setor: true, assumidoPor: { select: { id: true, nome: true } } },
      }),
      prisma.transferencia.create({
        data: {
          atendimentoId: id,
          deSetorId,
          paraSetorId: paraSetor.id,
          usuarioId: request.user!.sub,
        },
      }),
    ]);

    emitToSetor(deSetorId, 'atendimento:updated', { id });
    emitToSetor(paraSetor.id, 'atendimento:updated', { id });
    return updated;
  });

  app.post('/atendimentos/:id/limpar', async (request, reply) => {
    const { id } = request.params as { id: string };
    const atendimento = await prisma.atendimento.findUnique({ where: { id } });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }

    await prisma.$transaction([
      prisma.mensagem.updateMany({
        where: { atendimentoId: id },
        data: { conteudo: null },
      }),
      prisma.atendimento.update({
        where: { id },
        data: {
          conversaLimpaPorId: request.user!.sub,
          conversaLimpaEm: new Date(),
          ultimaMensagemPreview: null,
        },
      }),
    ]);

    emitToSetor(atendimento.setorId, 'atendimento:updated', { id });
    return { ok: true };
  });

  app.get('/atendimentos/:id/mensagens', async (request, reply) => {
    const { id } = request.params as { id: string };
    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
      include: { conversaLimpaPor: { select: { nome: true } } },
    });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }

    if (atendimento.conversaLimpaEm) {
      return {
        limpa: true,
        limpaPor: atendimento.conversaLimpaPor?.nome ?? 'Agente',
        limpaEm: atendimento.conversaLimpaEm,
        mensagens: [],
      };
    }

    const mensagens = await prisma.mensagem.findMany({
      where: { atendimentoId: id },
      include: { remetenteUsuario: { select: { id: true, nome: true } } },
      orderBy: { enviadoEm: 'asc' },
    });

    return { limpa: false, mensagens };
  });

  app.post('/atendimentos/:id/mensagens', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({ conteudo: z.string().min(1).max(4000) }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'conteudo obrigatório' });
    }

    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
      include: { setor: { include: { numeroWhatsapp: true } } },
    });
    if (!atendimento) {
      return reply.status(404).send({ error: 'Atendimento não encontrado' });
    }
    if (!canAccessSetor(request, atendimento.setorId)) {
      return reply.status(403).send({ error: 'Sem acesso a este setor' });
    }
    if (atendimento.status === 'encerrada') {
      return reply.status(400).send({ error: 'Atendimento encerrado' });
    }
    if (!atendimento.setor) {
      return reply.status(400).send({ error: 'Atendimento sem setor' });
    }

    // Assumir automaticamente se ainda aguardando
    if (atendimento.status === 'aguardando' || atendimento.assumidoPorId !== request.user!.sub) {
      await prisma.atendimento.update({
        where: { id },
        data: {
          status: 'em_atendimento',
          assumidoPorId: request.user!.sub,
          slaVenceEm: null,
        },
      });
    }

    const setorNome = atendimento.setor.nome;
    const texto = formatAgentMessage(setorNome, request.user!.nome, body.data.conteudo);

    const phoneNumberId =
      atendimento.setor.numeroWhatsapp?.phoneNumberId ||
      (atendimento.tipo === 'ocorrencia'
        ? env.WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL
        : env.WHATSAPP_PHONE_NUMBER_ID_CLIENTE);

    let waId: string | null = null;
    try {
      const sent = await sendTextMessage(phoneNumberId, atendimento.contatoTelefone, texto);
      waId = sent.messageId;
    } catch (err) {
      console.error('[mensagens] falha ao enviar WhatsApp', err);
      return reply.status(502).send({ error: 'Falha ao enviar mensagem no WhatsApp' });
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        atendimentoId: id,
        direcao: 'saida',
        remetenteUsuarioId: request.user!.sub,
        conteudo: texto,
        whatsappMessageId: waId,
      },
      include: { remetenteUsuario: { select: { id: true, nome: true } } },
    });

    await prisma.atendimento.update({
      where: { id },
      data: { ultimaMensagemPreview: previewText(body.data.conteudo) },
    });

    emitToSetor(atendimento.setorId, 'mensagem:nova', {
      atendimentoId: id,
      mensagem,
    });

    return mensagem;
  });

  app.get('/supervisor/indicadores', async (request, reply) => {
    if (request.user!.papel !== 'supervisor') {
      return reply.status(403).send({ error: 'Acesso restrito a supervisores' });
    }

    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const [aguardando, emAtendimento, encerradasHoje, slaEstourado] = await Promise.all([
      prisma.atendimento.count({ where: { status: 'aguardando' } }),
      prisma.atendimento.count({ where: { status: 'em_atendimento' } }),
      prisma.atendimento.count({
        where: { status: 'encerrada', atualizadoEm: { gte: inicioHoje } },
      }),
      prisma.atendimento.count({
        where: {
          status: 'aguardando',
          slaVenceEm: { lt: new Date() },
        },
      }),
    ]);

    const setores = await prisma.setor.findMany({
      include: {
        _count: {
          select: {
            atendimentos: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    const filas = await Promise.all(
      setores.map(async (s) => {
        const [ag, em, sla] = await Promise.all([
          prisma.atendimento.count({ where: { setorId: s.id, status: 'aguardando' } }),
          prisma.atendimento.count({ where: { setorId: s.id, status: 'em_atendimento' } }),
          prisma.atendimento.count({
            where: {
              setorId: s.id,
              status: 'aguardando',
              slaVenceEm: { lt: new Date() },
            },
          }),
        ]);
        return {
          id: s.id,
          nome: s.nome,
          slaMinutos: s.slaMinutos,
          aguardando: ag,
          emAtendimento: em,
          slaEstourado: sla,
        };
      }),
    );

    return {
      aguardando,
      emAtendimento,
      slaEstourado,
      encerradasHoje,
      filas,
    };
  });
}
