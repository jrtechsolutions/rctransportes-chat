import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import {
  AjustePendenciaModal,
  NovaPendenciaModal,
  type NovaPendenciaDados,
} from '../components/PendenciaModals';
import { PrioridadeBadge } from '../components/PrioridadeBadge';
import { MOTIVOS_ENCERRAMENTO, OCORRENCIAS, PENDENCIAS } from '../mock/data';
import type { Ocorrencia, Pendencia } from '../mock/types';
import { PENDENCIA_STATUS_CLASS, proximoProtocoloPendencia } from './PendenciasPage';
import styles from './PageShared.module.css';

const PRIORIDADE_CLASS: Record<string, string> = {
  Critica: styles.badgeCritica,
  Alta: styles.badgeAlta,
  Media: styles.badgeMedia,
  Baixa: styles.badgeBaixa,
};

const STATUS_CLASS: Record<string, string> = {
  Aberta: styles.badgeAberta,
  'Em andamento': styles.badgeAndamento,
  Resolvida: styles.badgeResolvida,
  Reaberta: styles.badgeReaberta,
};

type Prioridade = Ocorrencia['prioridade'];

function proximoProtocolo(itens: Ocorrencia[]): string {
  const nums = itens
    .map((o) => Number(o.protocolo.replace(/\D/g, '').slice(-4)))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `OC-2026-${String(next).padStart(4, '0')}`;
}

export function OcorrenciasPage() {
  const [status, setStatus] = useState('todas');
  const [prioridade, setPrioridade] = useState('todas');
  const [responsavel, setResponsavel] = useState('todos');
  const [itens, setItens] = useState(OCORRENCIAS);
  const [sel, setSel] = useState<Ocorrencia | null>(null);
  const [showNova, setShowNova] = useState(false);
  const [pendencias, setPendencias] = useState(PENDENCIAS);
  const [showNovaPend, setShowNovaPend] = useState(false);
  const [ajuste, setAjuste] = useState<{ tipo: 'responsavel' | 'prazo'; p: Pendencia } | null>(null);

  const [contato, setContato] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prioNova, setPrioNova] = useState<Prioridade>('Media');
  const [respNova, setRespNova] = useState('Carlos Mendes');
  const [prazoNova, setPrazoNova] = useState('');

  const responsaveis = useMemo(
    () => [...new Set(itens.map((o) => o.responsavel))],
    [itens],
  );

  const filtradas = itens.filter((o) => {
    if (status !== 'todas' && o.status !== status) return false;
    if (prioridade !== 'todas' && o.prioridade !== prioridade) return false;
    if (responsavel !== 'todos' && o.responsavel !== responsavel) return false;
    return true;
  });

  const abrirNova = () => {
    setContato('');
    setMotivo('');
    setPrioNova('Media');
    setRespNova(responsaveis[0] ?? 'Carlos Mendes');
    setPrazoNova('');
    setShowNova(true);
  };

  const criar = () => {
    if (!contato.trim() || !motivo.trim() || !prazoNova || !respNova.trim()) return;
    const protocolo = proximoProtocolo(itens);
    const nova: Ocorrencia = {
      id: `o-${Date.now()}`,
      protocolo,
      contato: contato.trim(),
      motivo: motivo.trim(),
      prioridade: prioNova,
      responsavel: respNova.trim(),
      prazo: prazoNova.includes('/')
        ? prazoNova
        : new Date(prazoNova + 'T12:00:00').toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
      status: 'Aberta',
      historico: [{ texto: `Criada manualmente · ${respNova.trim()}`, quando: 'agora' }],
    };
    setItens((list) => [nova, ...list]);
    setShowNova(false);
    setSel(nova);
  };

  const pendenciasDaSel = sel
    ? pendencias.filter((p) => p.origemTipo === 'Ocorrência' && p.origemRef === sel.protocolo)
    : [];

  const criarPendencia = (dados: NovaPendenciaDados) => {
    const nova: Pendencia = {
      id: `p-${Date.now()}`,
      protocolo: proximoProtocoloPendencia(pendencias),
      status: 'Aberta',
      ...dados,
    };
    setPendencias((l) => [nova, ...l]);
    setShowNovaPend(false);
  };

  const toggleStatus = () => {
    if (!sel) return;
    setItens((list) =>
      list.map((o) => {
        if (o.id !== sel.id) return o;
        if (o.status === 'Resolvida') {
          const next: Ocorrencia = {
            ...o,
            status: 'Reaberta',
            historico: [...o.historico, { texto: 'Reaberta (protótipo)', quando: 'agora' }],
          };
          setSel(next);
          return next;
        }
        const next: Ocorrencia = {
          ...o,
          status: 'Resolvida',
          historico: [
            ...o.historico,
            { texto: 'Marcada como resolvida (protótipo)', quando: 'agora' },
          ],
        };
        setSel(next);
        return next;
      }),
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.toolbar}>
          <div>
            <h1 className={styles.title}>Ocorrências</h1>
            <p className={styles.sub}>
              Independente das conversas — acompanhe protocolos e prazos operacionais
            </p>
          </div>
          <button type="button" className="btn btn-ambar" onClick={abrirNova}>
            Nova ocorrência
          </button>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.filter}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="Aberta">Aberta</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Resolvida">Resolvida</option>
            <option value="Reaberta">Reaberta</option>
          </select>
        </div>
        <div className={styles.filter}>
          <label>Prioridade</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="Critica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
        <div className={styles.filter}>
          <label>Responsável</label>
          <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            <option value="todos">Todos</option>
            {responsaveis.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filter}>
          <label>Período</label>
          <input type="date" defaultValue="2026-10-01" />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Cliente / Motorista</th>
            <th>Motivo</th>
            <th>Prioridade</th>
            <th>Responsável</th>
            <th>Prazo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map((o) => (
            <tr key={o.id} className={styles.rowClick} onClick={() => setSel(o)}>
              <td className="mono">{o.protocolo}</td>
              <td>{o.contato}</td>
              <td>{o.motivo}</td>
              <td>
                <span className={`badge ${PRIORIDADE_CLASS[o.prioridade]}`}>
                  {o.prioridade === 'Critica'
                    ? 'Crítica'
                    : o.prioridade === 'Media'
                      ? 'Média'
                      : o.prioridade}
                </span>
              </td>
              <td>{o.responsavel}</td>
              <td className="mono">{o.prazo}</td>
              <td>
                <span className={`${styles.badgeStatus} ${STATUS_CLASS[o.status]}`}>{o.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showNova && (
        <Modal title="Nova ocorrência" onClose={() => setShowNova(false)} wide>
          <p className={styles.notaIndep} style={{ marginTop: 0 }}>
            Abertura manual — gera um protocolo e entra na lista como Aberta.
          </p>
          <div className="field">
            <label>Cliente / Motorista *</label>
            <input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Ex.: Distribuidora ABC Ltda"
            />
          </div>
          <div className="field">
            <label>Motivo *</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="">Selecione…</option>
              {Object.entries(MOTIVOS_ENCERRAMENTO).map(([grupo, cats]) =>
                Object.entries(cats).map(([cat, opts]) => (
                  <optgroup key={`${grupo}-${cat}`} label={`${grupo} · ${cat}`}>
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Prioridade *</label>
              <select
                value={prioNova}
                onChange={(e) => setPrioNova(e.target.value as Prioridade)}
              >
                <option value="Critica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="field">
              <label>Prazo *</label>
              <input
                type="date"
                value={prazoNova}
                onChange={(e) => setPrazoNova(e.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Responsável *</label>
              <input
                value={respNova}
                onChange={(e) => setRespNova(e.target.value)}
                list="resp-sugestoes"
                placeholder="Nome do responsável"
              />
              <datalist id="resp-sugestoes">
                {responsaveis.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ambar"
            style={{ width: '100%' }}
            disabled={!contato.trim() || !motivo.trim() || !prazoNova || !respNova.trim()}
            onClick={criar}
          >
            Criar ocorrência
          </button>
        </Modal>
      )}

      {sel && (
        <Modal title={`Ocorrência ${sel.protocolo}`} onClose={() => setSel(null)} wide>
          <div className={styles.notaIndep}>
            Esta tela é independente da conversa do WhatsApp — não há encerramento de atendimento aqui.
          </div>

          <div className="field">
            <label>Cliente / Motorista</label>
            <input defaultValue={sel.contato} />
          </div>
          <div className="field">
            <label>Motivo</label>
            <textarea defaultValue={sel.motivo} rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Prioridade</label>
              <select defaultValue={sel.prioridade}>
                <option value="Critica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select defaultValue={sel.status}>
                <option>Aberta</option>
                <option>Em andamento</option>
                <option>Resolvida</option>
                <option>Reaberta</option>
              </select>
            </div>
            <div className="field">
              <label>Responsável</label>
              <input defaultValue={sel.responsavel} />
            </div>
            <div className="field">
              <label>Prazo</label>
              <input defaultValue={sel.prazo} className="mono" />
            </div>
          </div>

          <div className={styles.toolbar} style={{ margin: '20px 0 12px' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              Pendências vinculadas
            </h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNovaPend(true)}>
              Criar pendência
            </button>
          </div>
          {pendenciasDaSel.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--mono)', margin: '0 0 8px' }}>
              Nenhuma pendência vinculada a esta ocorrência.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {pendenciasDaSel.map((p) => (
                <div key={p.id} className={styles.card} style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--mono)' }}>
                      {p.protocolo}
                    </span>
                    <span className={`${styles.badgeStatus} ${PENDENCIA_STATUS_CLASS[p.status]}`}>
                      {p.status}
                    </span>
                    <PrioridadeBadge prioridade={p.prioridade} />
                  </div>
                  <div style={{ fontSize: 14, margin: '6px 0 4px' }}>{p.descricao}</div>
                  <div style={{ fontSize: 12, color: 'var(--mono)' }}>
                    {p.responsavel} · prazo <span className="mono">{p.prazo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAjuste({ tipo: 'responsavel', p })}
                    >
                      Alterar responsável
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAjuste({ tipo: 'prazo', p })}
                    >
                      Definir/alterar prazo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className={styles.sectionTitle}>Histórico</h3>
          <ul className={styles.timeline}>
            {sel.historico.map((h, i) => (
              <li key={i}>
                <span className={styles.timelineQuando}>{h.quando}</span>
                {h.texto}
              </li>
            ))}
          </ul>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-ghost" onClick={() => setSel(null)}>
              Fechar
            </button>
            <button
              type="button"
              className={sel.status === 'Resolvida' ? 'btn btn-ambar' : 'btn btn-verde'}
              onClick={toggleStatus}
            >
              {sel.status === 'Resolvida' ? 'Reabrir' : 'Marcar como resolvida'}
            </button>
          </div>
        </Modal>
      )}

      {sel && showNovaPend && (
        <NovaPendenciaModal
          origemFixa={{ tipo: 'Ocorrência', ref: sel.protocolo }}
          onClose={() => setShowNovaPend(false)}
          onCriar={criarPendencia}
        />
      )}

      {ajuste && (
        <AjustePendenciaModal tipo={ajuste.tipo} pendencia={ajuste.p} onClose={() => setAjuste(null)} />
      )}
    </div>
  );
}
