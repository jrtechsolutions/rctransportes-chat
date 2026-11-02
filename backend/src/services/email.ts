import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml } from '../utils/sanitize.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    throw new Error('SMTP não configurado (SMTP_HOST / SMTP_FROM)');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

type ChamadoEmail = {
  clienteNome: string;
  clienteEmail: string;
  destino: string;
  notaFiscal: string | null;
  tipoVeiculo: string;
  peso: string;
  horarioLimite: string;
  criadoPor: { nome: string; email: string };
};

export async function enviarEmailChamadoResolvido(chamado: ChamadoEmail): Promise<void> {
  const nf = chamado.notaFiscal ? ` · NF ${chamado.notaFiscal.replace(/^NF\s*/i, '')}` : '';
  const subject = `Chamado resolvido — ${chamado.destino}${nf}`;

  const linhas: Array<[string, string]> = [
    ['Cliente', chamado.clienteNome],
    ['Destino', chamado.destino],
    ...(chamado.notaFiscal ? ([['Nota fiscal', chamado.notaFiscal]] as Array<[string, string]>) : []),
    ['Veículo', chamado.tipoVeiculo],
    ['Peso', chamado.peso],
    ['Horário limite', chamado.horarioLimite],
  ];

  const text = [
    'Olá,',
    '',
    'Confirmamos que o seu pedido de transporte foi processado pela expedição da RC Transportes.',
    '',
    ...linhas.map(([k, v]) => `${k}: ${v}`),
    '',
    'Em caso de dúvida, responda este e-mail.',
    '',
    'RC Transportes',
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#F7F7F5;font-family:Arial,Helvetica,sans-serif;color:#14181C;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DCDFDA;border-radius:12px;overflow:hidden;">
    <div style="background:#1F4E7A;color:#fff;padding:18px 24px;font-weight:bold;font-size:16px;">RC Transportes · Expedição</div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px;">Olá,</p>
      <p style="margin:0 0 18px;">Confirmamos que o seu pedido de transporte foi <b style="color:#1F6B47;">processado pela expedição</b> da RC Transportes.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${linhas
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 0;color:#5B615D;width:140px;">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:bold;">${escapeHtml(v)}</td></tr>`,
          )
          .join('\n        ')}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#5B615D;">Em caso de dúvida, responda este e-mail.</p>
    </div>
  </div>
</body>
</html>`;

  const destinatarios = Array.from(
    new Set([chamado.clienteEmail, chamado.criadoPor.email].map((e) => e.trim().toLowerCase())),
  );

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to: destinatarios,
    replyTo: chamado.criadoPor.email,
    subject,
    text,
    html,
  });
}
