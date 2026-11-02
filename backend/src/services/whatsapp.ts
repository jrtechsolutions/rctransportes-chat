import { env } from '../config/env.js';

const BASE = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;

type SendResult = { messageId: string };

async function graphPost(phoneNumberId: string, body: unknown): Promise<SendResult> {
  if (!env.WHATSAPP_TOKEN) {
    console.warn('[whatsapp] WHATSAPP_TOKEN não configurado — mensagem simulada');
    return { messageId: `sim_${Date.now()}` };
  }

  const res = await fetch(`${BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  const messageId = data.messages?.[0]?.id ?? `wa_${Date.now()}`;
  return { messageId };
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
): Promise<SendResult> {
  return graphPost(phoneNumberId, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  });
}

export async function sendSectorMenu(phoneNumberId: string, to: string): Promise<SendResult> {
  const lgpd =
    'Suas mensagens são registradas para fins de atendimento, conforme a LGPD.';
  await sendTextMessage(phoneNumberId, to, lgpd);

  return graphPost(phoneNumberId, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'RC Transportes' },
      body: {
        text: 'Olá! Escolha o setor para o qual deseja falar:',
      },
      action: {
        button: 'Escolher setor',
        sections: [
          {
            title: 'Setores',
            rows: [
              { id: 'setor_comercial', title: 'Comercial' },
              { id: 'setor_financeiro', title: 'Financeiro' },
            ],
          },
        ],
      },
    },
  });
}

export async function sendMenuReminder(phoneNumberId: string, to: string): Promise<SendResult> {
  return sendTextMessage(
    phoneNumberId,
    to,
    'Você ainda está aí? Selecione uma opção do menu para continuar o atendimento.',
  );
}

export async function sendMenuTimeout(phoneNumberId: string, to: string): Promise<SendResult> {
  return sendTextMessage(
    phoneNumberId,
    to,
    'Encerramos este atendimento por inatividade. Quando quiser, envie uma nova mensagem.',
  );
}

/** Prefixo automático *Setor · Nome do agente* */
export function formatAgentMessage(setorNome: string, agenteNome: string, body: string): string {
  return `*${setorNome} · ${agenteNome}*\n${body}`;
}
