import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { formatDateTime, formatWhatsAppText, statusLabel } from '../lib/sanitize';
import type { Atendimento, Mensagem, Setor } from '../types';
import styles from './ChatPage.module.css';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lista, setLista] = useState<Atendimento[]>([]);
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [limpaInfo, setLimpaInfo] = useState<{ limpaPor: string; limpaEm: string } | null>(null);
  const [texto, setTexto] = useState('');
  const [setores, setSetores] = useState<Setor[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [paraSetorId, setParaSetorId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadLista = useCallback(async () => {
    const data = await api<Atendimento[]>('/atendimentos?status=todas');
    setLista(data.filter((a) => a.status !== 'encerrada' || a.tipo === 'ocorrencia').slice(0, 80));
  }, []);

  const loadAtendimento = useCallback(async (atId: string) => {
    const a = await api<Atendimento>(`/atendimentos/${atId}`);
    setAtendimento(a);
    const msgs = await api<{
      limpa: boolean;
      limpaPor?: string;
      limpaEm?: string;
      mensagens: Mensagem[];
    }>(`/atendimentos/${atId}/mensagens`);
    if (msgs.limpa) {
      setLimpaInfo({ limpaPor: msgs.limpaPor ?? 'Agente', limpaEm: msgs.limpaEm! });
      setMensagens([]);
    } else {
      setLimpaInfo(null);
      setMensagens(msgs.mensagens);
    }
  }, []);

  useEffect(() => {
    void api<Setor[]>('/setores').then(setSetores);
    void loadLista();
  }, [loadLista]);

  useEffect(() => {
    if (id) void loadAtendimento(id);
    else setAtendimento(null);
  }, [id, loadAtendimento]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, limpaInfo]);

  useSocket((event, payload) => {
    void loadLista();
    if (!id) return;
    const p = payload as { id?: string; atendimentoId?: string };
    if (p.id === id || p.atendimentoId === id || event === 'atendimento:updated') {
      void loadAtendimento(id);
    }
  });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !texto.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api(`/atendimentos/${id}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ conteudo: texto.trim() }),
      });
      setTexto('');
      await loadAtendimento(id);
      await loadLista();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar');
    } finally {
      setSending(false);
    }
  };

  const assumir = async () => {
    if (!id) return;
    await api(`/atendimentos/${id}/assumir`, { method: 'POST' });
    await loadAtendimento(id);
    await loadLista();
  };

  const encerrar = async () => {
    if (!id || !atendimento || atendimento.tipo !== 'ocorrencia') return;
    if (!confirm('Encerrar esta ocorrência?')) return;
    await api(`/atendimentos/${id}/encerrar`, { method: 'POST' });
    await loadAtendimento(id);
    await loadLista();
  };

  const limpar = async () => {
    if (!id) return;
    if (
      !confirm(
        'Limpar conversa? O conteúdo das mensagens será removido permanentemente. Esta ação não tem volta.',
      )
    ) {
      return;
    }
    await api(`/atendimentos/${id}/limpar`, { method: 'POST' });
    await loadAtendimento(id);
  };

  const transferir = async () => {
    if (!id || !paraSetorId) return;
    setError(null);
    try {
      await api(`/atendimentos/${id}/transferir`, {
        method: 'POST',
        body: JSON.stringify({ paraSetorId }),
      });
      setShowTransfer(false);
      await loadAtendimento(id);
      await loadLista();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao transferir');
    }
  };

  const outrosSetores = setores.filter((s) => s.id !== atendimento?.setorId);

  return (
    <div className={styles.page}>
      <aside className={styles.listPane}>
        <h2>Conversas</h2>
        <div className={styles.list}>
          {lista.map((a) => (
            <button
              key={a.id}
              type="button"
              className={a.id === id ? styles.listItemActive : styles.listItem}
              onClick={() => navigate(`/chat/${a.id}`)}
            >
              <strong>{a.contatoNome ?? a.contatoTelefone}</strong>
              <span className={styles.listPreview}>{a.ultimaMensagemPreview ?? '—'}</span>
              <span className={`badge badge-${a.status}`}>{statusLabel(a.status)}</span>
            </button>
          ))}
          {lista.length === 0 && <p className={styles.empty}>Nenhuma conversa aberta.</p>}
        </div>
      </aside>

      <section className={styles.chatPane}>
        {!id && <div className={styles.placeholder}>Selecione uma conversa</div>}
        {id && atendimento && (
          <>
            <header className={styles.chatHeader}>
              <div>
                <h1>{atendimento.contatoNome ?? 'Contato'}</h1>
                <div className="mono">{atendimento.contatoTelefone}</div>
                <div className={styles.headerMeta}>
                  {atendimento.setor?.nome ?? 'Sem setor'} ·{' '}
                  {atendimento.assumidoPor
                    ? `Atendendo: ${atendimento.assumidoPor.nome}`
                    : 'Não assumido'}
                </div>
              </div>
              <div className={styles.actions}>
                {atendimento.status === 'aguardando' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void assumir()}>
                    Assumir
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowTransfer((v) => !v)}
                  disabled={!atendimento.setorId}
                >
                  Transferir
                </button>
                {atendimento.tipo === 'ocorrencia' && atendimento.status !== 'encerrada' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void encerrar()}>
                    Encerrar
                  </button>
                )}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => void limpar()}>
                  Limpar conversa
                </button>
              </div>
            </header>

            {showTransfer && (
              <div className={styles.transferBar}>
                <select value={paraSetorId} onChange={(e) => setParaSetorId(e.target.value)}>
                  <option value="">Selecionar setor…</option>
                  {outrosSetores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!paraSetorId}
                  onClick={() => void transferir()}
                >
                  Confirmar transferência
                </button>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.messages}>
              {limpaInfo ? (
                <div className={styles.cleared}>
                  Conversa limpa por {limpaInfo.limpaPor} em {formatDateTime(limpaInfo.limpaEm)}
                </div>
              ) : (
                mensagens.map((m) => (
                  <div
                    key={m.id}
                    className={m.direcao === 'saida' ? styles.bubbleOut : styles.bubbleIn}
                  >
                    <div
                      className={styles.bubbleBody}
                      dangerouslySetInnerHTML={{ __html: formatWhatsAppText(m.conteudo) }}
                    />
                    <div className={styles.bubbleTime}>
                      {formatDateTime(m.enviadoEm)}
                      {m.remetenteUsuario ? ` · ${m.remetenteUsuario.nome}` : ''}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form className={styles.composer} onSubmit={(e) => void enviar(e)}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Digite a mensagem… (o cabeçalho Setor · Agente é adicionado automaticamente)"
                rows={2}
                disabled={atendimento.status === 'encerrada' || !!limpaInfo}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !texto.trim() || atendimento.status === 'encerrada'}
              >
                Enviar
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
