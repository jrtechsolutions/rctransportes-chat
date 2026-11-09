/**
 * Chave de acesso da NF-e (44 dígitos):
 * cUF(2) AAMM(4) CNPJ(14) modelo(2) série(3) número(9) tpEmis(1) código(8) DV(1)
 */

export function soDigitos(s: string): string {
  return s.replace(/\D/g, '');
}

/** Dígito verificador módulo 11, pesos 2..9 da direita para a esquerda */
export function dvChave(chave43: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += Number(chave43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function montarChave(p: {
  cnpj: string;
  aamm: string;
  serie: number;
  numero: number;
  codigo: string;
}): string {
  const base =
    '35' +
    p.aamm +
    soDigitos(p.cnpj) +
    '55' +
    String(p.serie).padStart(3, '0') +
    String(p.numero).padStart(9, '0') +
    '1' +
    p.codigo.padStart(8, '0');
  return base + dvChave(base);
}

export function formatarChave(chave: string): string {
  return soDigitos(chave).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatarCnpj(cnpj: string): string {
  const d = soDigitos(cnpj);
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export type Checagem = { label: string; ok: boolean | null };

/** Confere a chave lida contra ela mesma e contra o CNPJ/número lidos da nota */
export function validarNota(dados: { chave: string; cnpj: string; numero: string }): Checagem[] {
  const chave = soDigitos(dados.chave);
  const completa = chave.length === 44;
  return [
    { label: 'Chave com 44 dígitos', ok: completa },
    {
      label: 'Dígito verificador da chave',
      ok: completa ? dvChave(chave.slice(0, 43)) === Number(chave[43]) : null,
    },
    { label: 'Modelo 55 (NF-e)', ok: completa ? chave.slice(20, 22) === '55' : null },
    {
      label: 'CNPJ lido confere com a chave',
      ok: completa ? chave.slice(6, 20) === soDigitos(dados.cnpj) : null,
    },
    {
      label: 'Número da NF lido confere com a chave',
      ok: completa ? Number(chave.slice(25, 34)) === Number(soDigitos(dados.numero)) : null,
    },
  ];
}

export function notaValida(dados: { chave: string; cnpj: string; numero: string }): boolean {
  return validarNota(dados).every((c) => c.ok === true);
}
