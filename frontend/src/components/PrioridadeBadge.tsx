import type { Ocorrencia } from '../mock/types';
import styles from '../pages/PageShared.module.css';

const PRIORIDADE_CLASS: Record<Ocorrencia['prioridade'], string> = {
  Critica: styles.badgeCritica,
  Alta: styles.badgeAlta,
  Media: styles.badgeMedia,
  Baixa: styles.badgeBaixa,
};

export const PRIORIDADE_LABEL: Record<Ocorrencia['prioridade'], string> = {
  Critica: 'Crítica',
  Alta: 'Alta',
  Media: 'Média',
  Baixa: 'Baixa',
};

/** Badge Crítica/Alta/Média/Baixa — usado em Ocorrências e Pendências */
export function PrioridadeBadge({ prioridade }: { prioridade: Ocorrencia['prioridade'] }) {
  return (
    <span className={`badge ${PRIORIDADE_CLASS[prioridade]}`}>{PRIORIDADE_LABEL[prioridade]}</span>
  );
}
