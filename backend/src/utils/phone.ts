/** Normaliza telefone para E.164 só com dígitos (ex: 5511987654321). */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function previewText(text: string | null | undefined, max = 80): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}
