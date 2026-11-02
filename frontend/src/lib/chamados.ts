import type { StatusChamado } from '../types';

export function statusChamadoLabel(status: StatusChamado): string {
  switch (status) {
    case 'ABERTO':
      return 'Aberto';
    case 'EM_ANDAMENTO':
      return 'Em andamento';
    case 'RESOLVIDO':
      return 'Resolvido';
  }
}

export function minutosDesde(iso: string, agora: number = Date.now()): number {
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60_000));
}

/** "há 2 min", "há 1h05" */
export function tempoDesde(iso: string, agora: number = Date.now()): string {
  const min = minutosDesde(iso, agora);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return `há ${h}h${String(resto).padStart(2, '0')}`;
}

export function primeiroNome(nome: string | null | undefined): string {
  return nome?.trim().split(/\s+/)[0] ?? '';
}

/** Resumo de uma linha: "Campinas - SP · Truck 8.400 kg" */
export function resumoCarga(c: { destino: string; tipoVeiculo: string; peso: string }): string {
  return `${c.destino} · ${c.tipoVeiculo} ${c.peso}`;
}
