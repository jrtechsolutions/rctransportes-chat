import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NovaPendenciaModal, type NovaPendenciaDados } from '../components/PendenciaModals';
import { PrioridadeBadge } from '../components/PrioridadeBadge';
import { PENDENCIAS } from '../mock/data';
import type { Pendencia } from '../mock/types';
import styles from './PageShared.module.css';

export const PENDENCIA_STATUS_CLASS: Record<Pendencia['status'], string> = {
  Aberta: styles.badgeAzul,
  Vencida: styles.badgeVermelho,
  Concluída: styles.badgeVerde,
};

/** "dd/mm/aaaa hh:mm" → timestamp, só para ordenar a lista mockada */
function prazoTs(prazo: string): number {
  const [data, hora = '00:00'] = prazo.split(' ');
  const [d, m, a] = data.split('/').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(a, m - 1, d, h, min).getTime();
}

export function proximoProtocoloPendencia(itens: Pendencia[]): string {
  const nums = itens.map((p) => Number(p.protocolo.slice(-4))).filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PD-2026-${String(next).padStart(4, '0')}`;
}

export function OrigemCell({ p }: { p: Pendencia }) {
  if (!p.origemTipo) return <span style={{ color: 'var(--mono)', fontSize: 12 }}>Sem vínculo</span>;
  return (
    <>
      <span className={`badge ${p.origemTipo === 'Ocorrência' ? styles.badgeAmbar : styles.badgeAzul}`}>
        {p.origemTipo}
      </span>
      <Link
        to={p.origemTipo === 'Ocorrência' ? '/ocorrencias' : '/atendimento'}
        className={`link-edit ${styles.linkAbrir}`}
        title={p.origemRef ?? undefined}
      >
        Abrir
      </Link>
      {p.origemRef && (
        <div className="mono" style={{ fontSize: 11, color: 'var(--mono)', marginTop: 2 }}>
          {p.origemRef}
        </div>
      )}
    </>
  );
}

export function PendenciasPage() {
  const [itens, setItens] = useState(PENDENCIAS);
  const [status, setStatus] = useState('todas');
  const [responsavel, setResponsavel] = useState('todos');
  const [ordem, setOrdem] = useState('vencidas');
  const [showNova, setShowNova] = useState(false);

  const responsaveis = useMemo(() => [...new Set(itens.map((p) => p.responsavel))], [itens]);

  const lista = itens
    .filter((p) => (status === 'todas' ? true : p.status === status))
    .filter((p) => (responsavel === 'todos' ? true : p.responsavel === responsavel))
    .sort((a, b) => {
      if (ordem === 'vencidas') {
        const peso = (p: Pendencia) => (p.status === 'Vencida' ? 0 : p.status === 'Aberta' ? 1 : 2);
        return peso(a) - peso(b) || prazoTs(a.prazo) - prazoTs(b.prazo);
      }
      return ordem === 'proximo'
        ? prazoTs(a.prazo) - prazoTs(b.prazo)
        : prazoTs(b.prazo) - prazoTs(a.prazo);
    });

  const criar = (dados: NovaPendenciaDados) => {
    const nova: Pendencia = {
      id: `p-${Date.now()}`,
      protocolo: proximoProtocoloPendencia(itens),
      status: 'Aberta',
      ...dados,
    };
    setItens((l) => [nova, ...l]);
    setShowNova(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.toolbar}>
          <div>
            <h1 className={styles.title}>Pendências</h1>
            <p className={styles.sub}>
              Tarefas com responsável e prazo — vinculadas a uma ocorrência, a um atendimento ou avulsas
            </p>
          </div>
          <button type="button" className="btn btn-ambar" onClick={() => setShowNova(true)}>
            Nova pendência
          </button>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.filter}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="Aberta">Aberta</option>
            <option value="Vencida">Vencida</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>
        <div className={styles.filter}>
          <label>Responsável</label>
          <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            <option value="todos">Todos</option>
            {responsaveis.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className={styles.filter}>
          <label>Prazo</label>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="vencidas">Vencidas primeiro</option>
            <option value="proximo">Mais próximo</option>
            <option value="distante">Mais distante</option>
          </select>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Origem</th>
            <th>Descrição</th>
            <th>Responsável</th>
            <th>Prazo</th>
            <th>Status</th>
            <th>Prioridade</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id} className={p.status === 'Vencida' ? styles.rowVencida : undefined}>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                {p.protocolo}
              </td>
              <td>
                <OrigemCell p={p} />
              </td>
              <td>{p.descricao}</td>
              <td>{p.responsavel}</td>
              <td className="mono">{p.prazo}</td>
              <td>
                <span className={`${styles.badgeStatus} ${PENDENCIA_STATUS_CLASS[p.status]}`}>{p.status}</span>
              </td>
              <td>
                <PrioridadeBadge prioridade={p.prioridade} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showNova && <NovaPendenciaModal onClose={() => setShowNova(false)} onCriar={criar} />}
    </div>
  );
}
