import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { emitToSetor } from '../lib/socket.js';
import { normalizePhone, previewText } from '../utils/phone.js';
import {
  sendMenuReminder,
  sendMenuTimeout,
  sendSectorMenu,
  sendTextMessage,
} from './whatsapp.js';

type IncomingMessage = {
  phoneNumberId: string;
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text?: string;
  listReplyId?: string;
  listReplyTitle?: string;
  contactName?: string;
};

const MENU_REMINDER_MS = 10 * 60 * 1000;
const MENU_TIMEOUT_MS = 20 * 60 * 1000;

export async function processWhatsAppPayload(payload: unknown) {
  const messages = extractMessages(payload);
  for (const msg of messages) {
    try {
      await handleIncomingMessage(msg);
    } catch (err) {
      console.error('[webhook] erro ao processar mensagem', msg.messageId, err);
    }
  }
}

function extractMessages(payload: unknown): IncomingMessage[] {
  const result: IncomingMessage[] = [];
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          metadata?: { phone_number_id?: string };
          contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
          messages?: Array<{
            id: string;
            from: string;
            timestamp: string;
            type: string;
            text?: { body?: string };
            interactive?: {
              type?: string;
              list_reply?: { id?: string; title?: string };
            };
          }>;
        };
      }>;
    }>;
  };

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      const phoneNumberId = value.metadata?.phone_number_id ?? '';
      const contactName = value.contacts?.[0]?.profile?.name;

      for (const m of value.messages) {
        result.push({
          phoneNumberId,
          from: normalizePhone(m.from),
          messageId: m.id,
          timestamp: m.timestamp,
          type: m.type,
          text: m.text?.body,
          listReplyId: m.interactive?.list_reply?.id,
          listReplyTitle: m.interactive?.list_reply?.title,
          contactName,
        });
      }
    }
  }
  return result;
}

async function handleIncomingMessage(msg: IncomingMessage) {
  const existing = await prisma.mensagem.findUnique({
    where: { whatsappMessageId: msg.messageId },
  });
  if (existing) return;

  // Resolve contra numeros_whatsapp (só existem dois: clientes | motorista)
  const numero = msg.phoneNumberId
    ? await prisma.numeroWhatsapp.findFirst({
        where: { phoneNumberId: msg.phoneNumberId },
      })
    : null;

  const isMotorista =
    numero?.uso === 'motorista' ||
    (!!env.WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL &&
      msg.phoneNumberId === env.WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL);

  const isCliente =
    numero?.uso === 'clientes' ||
    (!!env.WHATSAPP_PHONE_NUMBER_ID_CLIENTE &&
      msg.phoneNumberId === env.WHATSAPP_PHONE_NUMBER_ID_CLIENTE);

  if (isMotorista) {
    await handleMotoristaMessage(msg);
    return;
  }

  if (isCliente) {
    await handleClienteMessage(msg);
    return;
  }

  console.warn('[webhook] phone_number_id não mapeado:', msg.phoneNumberId);
}

async function handleMotoristaMessage(msg: IncomingMessage) {
  const motorista = await prisma.motorista.findUnique({
    where: { telefone: msg.from },
  });

  const setorOperacional = await prisma.setor.findFirst({
    where: { nome: { equals: 'Operacional', mode: 'insensitive' } },
  });

  let atendimento = await prisma.atendimento.findFirst({
    where: {
      tipo: 'ocorrencia',
      contatoTelefone: msg.from,
      status: { in: ['aguardando', 'em_atendimento'] },
    },
    orderBy: { atualizadoEm: 'desc' },
  });

  const naoIdentificado = !motorista || !motorista.ativo;
  const nome = motorista?.ativo ? motorista.nome : msg.contactName ?? 'Motorista não identificado';

  if (!atendimento) {
    atendimento = await prisma.atendimento.create({
      data: {
        tipo: 'ocorrencia',
        setorId: setorOperacional?.id ?? null,
        contatoTelefone: msg.from,
        contatoNome: nome,
        status: 'aguardando',
        motoristaNaoIdentificado: naoIdentificado,
        ultimaMensagemPreview: previewText(msg.text),
        slaVenceEm: setorOperacional
          ? new Date(Date.now() + setorOperacional.slaMinutos * 60_000)
          : null,
      },
    });
  } else {
    const sla =
      atendimento.status === 'aguardando' && setorOperacional
        ? new Date(Date.now() + setorOperacional.slaMinutos * 60_000)
        : atendimento.slaVenceEm;

    atendimento = await prisma.atendimento.update({
      where: { id: atendimento.id },
      data: {
        ultimaMensagemPreview: previewText(msg.text),
        contatoNome: nome,
        motoristaNaoIdentificado: naoIdentificado,
        slaVenceEm: sla,
        status: atendimento.status === 'encerrada' ? 'aguardando' : atendimento.status,
      },
    });
  }

  await prisma.mensagem.create({
    data: {
      atendimentoId: atendimento.id,
      direcao: 'entrada',
      conteudo: msg.text ?? `[${msg.type}]`,
      whatsappMessageId: msg.messageId,
      enviadoEm: new Date(Number(msg.timestamp) * 1000),
    },
  });

  emitToSetor(atendimento.setorId, 'atendimento:updated', { id: atendimento.id });
}

async function handleClienteMessage(msg: IncomingMessage) {
  let atendimento = await prisma.atendimento.findFirst({
    where: {
      tipo: 'conversa',
      contatoTelefone: msg.from,
      status: { in: ['aguardando', 'em_atendimento'] },
    },
    orderBy: { atualizadoEm: 'desc' },
  });

  // Menu reply
  if (msg.listReplyId && atendimento?.aguardandoMenu) {
    const setorNome = msg.listReplyId.replace('setor_', '');
    const setor = await prisma.setor.findFirst({
      where: { nome: { equals: setorNome, mode: 'insensitive' } },
    });

    if (!setor) {
      await sendSectorMenu(msg.phoneNumberId, msg.from);
      return;
    }

    atendimento = await prisma.atendimento.update({
      where: { id: atendimento.id },
      data: {
        setorId: setor.id,
        aguardandoMenu: false,
        menuEnviadoEm: null,
        menuLembreteEnviadoEm: null,
        status: 'aguardando',
        contatoNome: msg.contactName ?? atendimento.contatoNome,
        ultimaMensagemPreview: previewText(msg.listReplyTitle ?? setor.nome),
        slaVenceEm: new Date(Date.now() + setor.slaMinutos * 60_000),
      },
    });

    await prisma.mensagem.create({
      data: {
        atendimentoId: atendimento.id,
        direcao: 'entrada',
        conteudo: msg.listReplyTitle ?? setor.nome,
        whatsappMessageId: msg.messageId,
        enviadoEm: new Date(Number(msg.timestamp) * 1000),
      },
    });

    emitToSetor(setor.id, 'atendimento:updated', { id: atendimento.id });
    return;
  }

  // Novo cliente ou sem atendimento aberto → menu
  if (!atendimento) {
    atendimento = await prisma.atendimento.create({
      data: {
        tipo: 'conversa',
        setorId: null,
        contatoTelefone: msg.from,
        contatoNome: msg.contactName ?? null,
        status: 'aguardando',
        aguardandoMenu: true,
        menuEnviadoEm: new Date(),
        ultimaMensagemPreview: previewText(msg.text),
      },
    });

    await prisma.mensagem.create({
      data: {
        atendimentoId: atendimento.id,
        direcao: 'entrada',
        conteudo: msg.text ?? `[${msg.type}]`,
        whatsappMessageId: msg.messageId,
        enviadoEm: new Date(Number(msg.timestamp) * 1000),
      },
    });

    const menu = await sendSectorMenu(msg.phoneNumberId, msg.from);
    await prisma.mensagem.create({
      data: {
        atendimentoId: atendimento.id,
        direcao: 'saida',
        conteudo: '[Menu de setores enviado]',
        whatsappMessageId: menu.messageId,
      },
    });
    return;
  }

  // Aguardando menu e texto livre → ignorar e reenviar menu
  if (atendimento.aguardandoMenu) {
    await sendSectorMenu(msg.phoneNumberId, msg.from);
    return;
  }

  // Conversa normal
  const setor = atendimento.setorId
    ? await prisma.setor.findUnique({ where: { id: atendimento.setorId } })
    : null;

  const sla =
    atendimento.status === 'aguardando' && setor
      ? new Date(Date.now() + setor.slaMinutos * 60_000)
      : atendimento.slaVenceEm;

  atendimento = await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: {
      ultimaMensagemPreview: previewText(msg.text),
      contatoNome: msg.contactName ?? atendimento.contatoNome,
      slaVenceEm: sla,
    },
  });

  await prisma.mensagem.create({
    data: {
      atendimentoId: atendimento.id,
      direcao: 'entrada',
      conteudo: msg.text ?? `[${msg.type}]`,
      whatsappMessageId: msg.messageId,
      enviadoEm: new Date(Number(msg.timestamp) * 1000),
    },
  });

  emitToSetor(atendimento.setorId, 'atendimento:updated', { id: atendimento.id });
}

/** Job periódico: lembrete (10min) e timeout (20min) do menu. */
export async function processMenuTimeouts() {
  const agora = Date.now();
  const pendentes = await prisma.atendimento.findMany({
    where: {
      tipo: 'conversa',
      aguardandoMenu: true,
      status: { in: ['aguardando', 'em_atendimento'] },
    },
  });

  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID_CLIENTE;

  for (const a of pendentes) {
    if (!a.menuEnviadoEm) continue;
    const elapsed = agora - a.menuEnviadoEm.getTime();

    if (elapsed >= MENU_TIMEOUT_MS) {
      if (phoneId) {
        await sendMenuTimeout(phoneId, a.contatoTelefone);
      }
      await prisma.atendimento.update({
        where: { id: a.id },
        data: {
          status: 'encerrada',
          aguardandoMenu: false,
        },
      });
      continue;
    }

    if (elapsed >= MENU_REMINDER_MS && !a.menuLembreteEnviadoEm) {
      if (phoneId) {
        await sendMenuReminder(phoneId, a.contatoTelefone);
      }
      await prisma.atendimento.update({
        where: { id: a.id },
        data: { menuLembreteEnviadoEm: new Date() },
      });
    }
  }
}

export { sendTextMessage };
