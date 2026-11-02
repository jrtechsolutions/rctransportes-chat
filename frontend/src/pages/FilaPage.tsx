import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { formatDateTime, initials, statusLabel } from '../lib/sanitize';
import type { Atendimento, Setor } from '../types';
import { useAuth } from '../auth/AuthContext';
import styles from './FilaPage.module.css';

type StatusFilter = 'todas' | 'aguardando' | 'em_atendimento' | 'encerrada';

export function FilaPage() {
  const { user } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorId, setSetorId] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [items, setItems] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (setorId !== 'all') qs.set('setorId', setorId);
      if (status !== 'todas') qs.set('status', status);
      const data = await api<Atendimento[]>(`/atendimentos?${qs.toString()}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [setorId, status]);

  useEffect(() => {
    void api<Setor[]>('/setores').then(setSetores);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSocket(() => {
    void load();
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of user?.setores ?? setores) {
      map[s.id] = items.filter((i) => i.setorId === s.id && i.status !== 'encerrada').length;
    }
    return map;
  }, [items, user, setores]);

  const isSlaEstourado = (a: Atendimento) =>
    a.status === 'aguardando' && a.slaVenceEm && new Date(a.slaVenceEm) < new Date();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Fila de atendimento</h1>
          <p className={styles.sub}>Conversas e ocorrências dos seus setores</p>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.setorChips}>
          <button
            type="button"
            className={setorId === 'all' ? styles.chipActive : styles.chip}
            onClick={() => setSetorId('all')}
          >
            Todos
          </button>
          {(user?.papel === 'supervisor' ? setores : user?.setores ?? []).map((s) => (
            <button
              key={s.id}
              type="button"
              className={setorId === s.id ? styles.chipActive : styles.chip}
              onClick={() => setSetorId(s.id)}
            >
              {s.nome}
              {counts[s.id] != null && <span className={styles.count}>{counts[s.id]}</span>}
            </button>
          ))}
        </div>

        <div className={styles.statusTabs}>
          {(
            [
              ['todas', 'Todas'],
              ['aguardando', 'Aguardando'],
              ['em_atendimento', 'Em atendimento'],
              ['encerrada', 'Encerradas'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={status === value ? styles.tabActive : styles.tab}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {loading && <p className={styles.empty}>Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className={styles.empty}>Nenhum atendimento nesta fila.</p>
        )}
        {items.map((a) => (
          <Link key={a.id} to={`/chat/${a.id}`} className={styles.row}>
            <div className={styles.avatar}>{initials(a.contatoNome)}</div>
            <div className={styles.meta}>
              <div className={styles.top}>
                <strong>
                  {a.contatoNome ?? 'Sem nome'}
                  {a.motoristaNaoIdentificado && (
                    <span className={styles.warn}> · não identificado</span>
                  )}
                </strong>
                <span className="mono">{formatDateTime(a.atualizadoEm)}</span>
              </div>
              <div className={`${styles.phone} mono`}>{a.contatoTelefone}</div>
              <div className={styles.preview}>{a.ultimaMensagemPreview ?? '—'}</div>
            </div>
            <div className={styles.badges}>
              {isSlaEstourado(a) && <span className="badge badge-sla">SLA estourado</span>}
              <span className={`badge badge-${a.status}`}>{statusLabel(a.status)}</span>
              {a.setor && <span className={styles.setorTag}>{a.setor.nome}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
