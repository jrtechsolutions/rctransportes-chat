/** Escapa HTML para prevenir XSS a partir de conteúdo do WhatsApp. */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Converte *negrito* do WhatsApp em <strong> após escapar. */
export function formatWhatsAppText(raw: string | null | undefined): string {
  if (!raw) return '';
  const escaped = escapeHtml(raw);
  return escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
}

export function formatPhone(phone: string): string {
  return phone;
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'aguardando':
      return 'Aguardando';
    case 'em_atendimento':
      return 'Em atendimento';
    case 'encerrada':
      return 'Encerrada';
    default:
      return status;
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
