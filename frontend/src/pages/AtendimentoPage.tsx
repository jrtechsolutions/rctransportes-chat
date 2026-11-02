import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import {
  AGENTES_POR_SETOR,
  CONVERSAS,
  MOTIVOS_ENCERRAMENTO,
  RESULTADOS_ATENDIMENTO,
  SETORES,
} from '../mock/data';
import styles from './AtendimentoPage.module.css';

type Aba = 'todas' | 'minhas' | 'setor';

const TIPO_CLASS: Record<string, string> = {
  Motorista: styles.tipoMotorista,
  Agregado: styles.tipoAgregado,
  Cliente: styles.tipoCliente,
  'Lead novo': styles.tipoLead,
};

export function AtendimentoPage() {
  const [aba, setAba] = useState<Aba>('todas');
  const [setorFiltro, setSetorFiltro] = useState('Operacional');
  const [selecionada, setSelecionada] = useState(CONVERSAS[0].id);
  const [obsInterna, setObsInterna] = useState('');
  const [msgDraft, setMsgDraft] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [showEncerrar, setShowEncerrar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [resultado, setResultado] = useState('');
  const [descComplementar, setDescComplementar] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const lista = useMemo(() => {
    return CONVERSAS.filter((c) => {
      if (aba === 'minhas') return c.minha;
      if (aba === 'setor') return c.setor === setorFiltro;
      return true;
    });
  }, [aba, setorFiltro]);

  const conversa = CONVERSAS.find((c) => c.id === selecionada) ?? lista[0] ?? CONVERSAS[0];

  const confirmarEncerramento = () => {
    if (!motivo || !resultado) return;
    setShowEncerrar(false);
    setFeedback(`Atendimento encerrado · ${motivo} · ${resultado}`);
    setMotivo('');
    setResultado('');
    setDescComplementar('');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className={styles.page}>
      <aside className={styles.listPane}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={aba === 'todas' ? styles.tabActive : styles.tab}
            onClick={() => setAba('todas')}
          >
            Todas
          </button>
          <button
            type="button"
            className={aba === 'minhas' ? styles.tabActive : styles.tab}
            onClick={() => setAba('minhas')}
          >
            Minhas
          </button>
          <button
            type="button"
            className={aba === 'setor' ? styles.tabActive : styles.tab}
            onClick={() => setAba('setor')}
          >
            Setor
          </button>
        </div>

        {aba === 'setor' && (
          <div className={styles.setorFiltro}>
            <select value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value)}>
              {SETORES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.list}>
          {lista.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === conversa.id ? styles.listItemActive : styles.listItem}
              onClick={() => setSelecionada(c.id)}
            >
              <div className={styles.listTop}>
                <strong>{c.nome}</strong>
                <span className={styles.tempo}>{c.tempo}</span>
              </div>
              <div className={styles.listMeta}>
                <span className={`${styles.tipoBadge} ${TIPO_CLASS[c.tipo]}`}>{c.tipo}</span>
                {c.sla === 'critico' && (
                  <span className={styles.slaCritico}>
                    <span className={styles.slaDot} />
                    {c.slaLabel}
                  </span>
                )}
                {c.sla === 'ok' && <span className={styles.slaOk}>{c.slaLabel}</span>}
              </div>
              <div className={styles.listPreview}>{c.ultimaMensagem}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className={styles.chatPane}>
        {feedback && <div className={styles.toast}>{feedback}</div>}

        <header className={styles.chatHeader}>
          <div>
            <h1>{conversa.nome}</h1>
            <div className={styles.headerMeta}>
              <span className={`${styles.tipoBadge} ${TIPO_CLASS[conversa.tipo]}`}>{conversa.tipo}</span>
              <span className="mono">{conversa.telefone}</span>
              <span>· {conversa.setor}</span>
              <span>· Atendendo: {conversa.agente ?? 'Fila'}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowTransfer(true)}>
              Transferir
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowEncerrar(true)}>
              Encerrar atendimento
            </button>
          </div>
        </header>

        <div className={styles.messages}>
          {conversa.mensagens.map((m) => (
            <div
              key={m.id}
              className={m.de === 'agente' ? styles.bubbleOut : styles.bubbleIn}
            >
              <div className={styles.bubbleText}>{m.texto}</div>
              <div className={styles.bubbleHora}>{m.hora}</div>
            </div>
          ))}
        </div>

        <div className={styles.obsBox}>
          <div className={styles.obsLabel}>
            <span aria-hidden>🔒</span> Observação interna
          </div>
          <p className={styles.obsHint}>Visível só para a equipe — nunca é enviado ao cliente</p>
          <textarea
            value={obsInterna}
            onChange={(e) => setObsInterna(e.target.value)}
            placeholder="Anote algo para o próximo atendente…"
            rows={2}
          />
        </div>

        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            setMsgDraft('');
          }}
        >
          <input
            value={msgDraft}
            onChange={(e) => setMsgDraft(e.target.value)}
            placeholder="Digite uma mensagem…"
          />
          <button type="submit" className="btn btn-primary" disabled={!msgDraft.trim()}>
            Enviar
          </button>
        </form>
      </section>

      {showTransfer && (
        <Modal title="Transferir atendimento" onClose={() => setShowTransfer(false)}>
          <div className="field">
            <label>Setor</label>
            <select defaultValue="Operacional">
              {SETORES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Agente</label>
            <select defaultValue="">
              <option value="">Fila do setor</option>
              {Object.values(AGENTES_POR_SETOR)
                .flat()
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-ambar"
            style={{ width: '100%' }}
            onClick={() => {
              setShowTransfer(false);
              setFeedback('Transferência registrada (mock)');
              setTimeout(() => setFeedback(null), 3000);
            }}
          >
            Confirmar transferência
          </button>
        </Modal>
      )}

      {showEncerrar && (
        <Modal title="Encerrar atendimento" onClose={() => setShowEncerrar(false)} wide>
          <div className="field">
            <label>Motivo do contato *</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
              <option value="">Selecione…</option>
              {(Object.entries(MOTIVOS_ENCERRAMENTO) as [string, Record<string, readonly string[]>][]).map(
                ([grupo, cats]) =>
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
          <div className="field">
            <label>Resultado do atendimento *</label>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)} required>
              <option value="">Selecione…</option>
              {RESULTADOS_ATENDIMENTO.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Descrição complementar (opcional)</label>
            <textarea
              rows={3}
              value={descComplementar}
              onChange={(e) => setDescComplementar(e.target.value)}
              placeholder="Detalhes adicionais…"
            />
          </div>
          <button
            type="button"
            className="btn btn-ambar"
            style={{ width: '100%' }}
            disabled={!motivo || !resultado}
            onClick={confirmarEncerramento}
          >
            Confirmar encerramento
          </button>
        </Modal>
      )}
    </div>
  );
}
