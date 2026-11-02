/**
 * Remove marcação HTML de texto livre antes de persistir.
 * Preserva endereços entre sinais de menor/maior comuns em e-mails colados
 * (ex.: "Fulano <fulano@cliente.com.br>"), pois não casam com nome de tag seguido de espaço, "/" ou ">".
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\/?>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function sanitizeOptional(input: string | null | undefined): string | null {
  if (input == null) return null;
  const clean = sanitizeText(input);
  return clean.length ? clean : null;
}

/** Escapa texto para interpolação em HTML (corpo de e-mail). */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
