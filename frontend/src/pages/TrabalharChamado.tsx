import { useMemo, useState } from 'react';
import { formatDateTime } from '../lib/sanitize';
import { resumoCarga, statusChamadoLabel, tempoDesde } from '../lib/chamados';
import { useChamados } from '../mock/ChamadosContext';
import { usePrototype } from '../mock/PrototypeContext';
import { UNIDADES_EXPEDICAO, type ChamadoMock, type UnidadeExpedicao } from '../mock/types';
import styles from './TrabalharChamado.module.css';

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export function TrabalharChamado() {
  const { usuario } = usePrototype();
  const { chamados: todos, setChamados: setItens } = useChamados();
  const minhasUnidades: UnidadeExpedicao[] = usuario.admin
    ? UNIDADES_EXPEDICAO
    : usuario.unidadesChamado ?? [];
  const [filtroUnidade, setFiltroUnidade] = useState<UnidadeExpedicao | 'todas'>('todas');
  const itens = useMemo(
    () =>
      todos.filter(
        (c) =>
          minhasUnidades.includes(c.unidade) && (filtroUnidade === 'todas' || c.unidade === filtroUnidade),
      ),
    [todos, minhasUnidades, filtroUnidade],
  );
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const ativos = useMemo(
    () => itens.filter((c) => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO'),
    [itens],
  );
  const pendentesEmail = useMemo(
    () => itens.filter((c) => c.status === 'RESOLVIDO' && !c.emailConfirmacaoEnviadoEm),
    [itens],
  );

  const detalhe = itens.find((c) => c.id === selecionadoId) ?? null;
  const abertos = ativos.filter((c) => c.status === 'ABERTO').length;
  const emAndamento = ativos.filter((c) => c.status === 'EM_ANDAMENTO').length;

  const abrir = (chamado: ChamadoMock) => {
    setErro(null);
    setAviso(null);
    setObservacao('');
    setSelecionadoId(chamado.id);
    setItens((list) =>
      list.map((c) => {
        if (c.id !== chamado.id) return c;
        const lido = { ...c, complementoNovo: false };
        return c.status === 'ABERTO'
          ? {
              ...lido,
              status: 'EM_ANDAMENTO',
              assumidoPorId: 'mock-user',
              assumidoPor: { id: 'mock-user', nome: 'Você (protótipo)' },
            }
          : lido;
      }),
    );
  };

  const salvarObservacao = () => {
    if (!detalhe || !observacao.trim()) return;
    const nova = {
      id: `obs-${Date.now()}`,
      chamadoId: detalhe.id,
      autorId: 'mock-user',
      texto: observacao.trim(),
      criadoEm: new Date().toISOString(),
      autor: { id: 'mock-user', nome: 'Você (protótipo)' },
    };
    setItens((list) =>
      list.map((c) => (c.id === detalhe.id ? { ...c, observacoes: [...c.observacoes, nova] } : c)),
    );
    setObservacao('');
  };

  const resolver = () => {
    if (!detalhe) return;
    setItens((list) =>
      list.map((c) =>
        c.id === detalhe.id
          ? {
              ...c,
              status: 'RESOLVIDO' as const,
              resolvidoEm: new Date().toISOString(),
              emailConfirmacaoEnviadoEm: new Date().toISOString(),
            }
          : c,
      ),
    );
    setConfirmando(false);
    setAviso(`Chamado de ${detalhe.clienteNome} resolvido. E-mail de confirmação enviado (mock).`);
    setSelecionadoId(null);
  };

  const reenviarEmail = () => {
    if (!detalhe) return;
    setItens((list) =>
      list.map((c) =>
        c.id === detalhe.id ? { ...c, emailConfirmacaoEnviadoEm: new Date().toISOString() } : c,
      ),
    );
    setAviso(`E-mail de confirmação de ${detalhe.clienteNome} reenviado (mock).`);
    setSelecionadoId(null);
  };

  const itemClass = (c: ChamadoMock) => {
    const sel = c.id === selecionadoId;
    if (c.status === 'RESOLVIDO') return sel ? `${styles.item} ${styles.itemSelErro}` : styles.item;
    if (!sel) return styles.item;
    return `${styles.item} ${c.status === 'ABERTO' ? styles.itemSelAberto : styles.itemSelAndamento}`;
  };

  const badgeClass = (c: ChamadoMock) => {
    const sel = c.id === selecionadoId;
    if (c.status === 'ABERTO') return sel ? styles.badgeAbertoForte : styles.badgeAberto;
    return styles.badgeAndamento;
  };

  const renderItem = (c: ChamadoMock) => (
    <button key={c.id} type="button" className={itemClass(c)} onClick={() => abrir(c)}>
      <div className={styles.itemMain}>
        <div className={styles.itemNome}>
          {c.clienteNome}
          {minhasUnidades.length > 1 && <span className={styles.unidadeTag}>{c.unidade}</span>}
        </div>
        <div className={c.status === 'ABERTO' && c.id === selecionadoId ? styles.itemResumoAmbar : styles.itemResumo}>
          {resumoCarga(c)} · limite {c.horarioLimite}
          {c.assumidoPor && c.status === 'EM_ANDAMENTO' && ` · ${c.assumidoPor.nome}`}
        </div>
      </div>
      {c.complementoNovo && <span className={styles.badgeComplemento}>Novo complemento</span>}
      {c.status === 'RESOLVIDO' ? (
        <span className={styles.badgeErro}>E-mail não enviado</span>
      ) : (
        <span className={badgeClass(c)}>{statusChamadoLabel(c.status)}</span>
      )}
    </button>
  );

  const d = detalhe;

  return (
    <div className={styles.page}>
      <div className={styles.listaPane}>
        <header className={styles.header}>
          <h1 className={styles.title}>Chamados</h1>
          <div className={styles.sub}>
            Expedição {minhasUnidades.join(' e ') || '—'} ·{' '}
            {plural(abertos, 'aberto', 'abertos')}, {plural(emAndamento, 'em andamento', 'em andamento')}
          </div>
          {minhasUnidades.length > 1 && (
            <div className={styles.filtroUnidade} role="group" aria-label="Filtrar por unidade">
              {(['todas', ...UNIDADES_EXPEDICAO] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={filtroUnidade === u ? styles.filtroAtivo : styles.filtroBtn}
                  onClick={() => setFiltroUnidade(u)}
                >
                  {u === 'todas' ? 'Todas' : u}
                </button>
              ))}
            </div>
          )}
        </header>

        {minhasUnidades.length === 0 && (
          <p className={styles.empty}>
            Seu usuário não tem unidade de expedição liberada. Peça ao administrador para marcar Matriz
            e/ou Filial no seu cadastro.
          </p>
        )}

        {(erro || aviso) && (
          <div className={styles.alertas}>
            {erro && <div className={styles.erro}>{erro}</div>}
            {aviso && <div className={styles.sucesso}>{aviso}</div>}
          </div>
        )}

        <div className={styles.lista}>
          {ativos.length === 0 && pendentesEmail.length === 0 && (
            <p className={styles.empty}>Nenhum chamado pendente.</p>
          )}
          {ativos.map(renderItem)}

          {pendentesEmail.length > 0 && (
            <>
              <div className={styles.secao}>E-mail de confirmação pendente</div>
              {pendentesEmail.map(renderItem)}
            </>
          )}
        </div>
      </div>

      <aside className={styles.detalhePane}>
        {!d && <p className={styles.emptyDetalhe}>Selecione um chamado para ver os detalhes.</p>}
        {d && (
          <>
            <div className={styles.detalheHeader}>
              <h2 className={styles.detalheNome}>{d.clienteNome}</h2>
              <div className={styles.detalheSub}>
                Expedição {d.unidade} · {d.notaFiscal ? `${d.notaFiscal} · ` : ''}
                {d.clienteEmail}
              </div>
            </div>

            <div className={styles.detalheBody}>
              <div className={styles.grid}>
                <div>
                  <span className={styles.gridLabel}>Destino</span>
                  <br />
                  <b>{d.destino}</b>
                </div>
                <div>
                  <span className={styles.gridLabel}>Veículo</span>
                  <br />
                  <b>{d.tipoVeiculo}</b>
                </div>
                <div>
                  <span className={styles.gridLabel}>Peso</span>
                  <br />
                  <b>{d.peso}</b>
                </div>
                <div>
                  <span className={styles.gridLabel}>Limite</span>
                  <br />
                  <b className={styles.limite}>{d.horarioLimite}</b>
                </div>
              </div>

              <div className={styles.meta}>
                Aberto por {d.criadoPor.nome} · {tempoDesde(d.criadoEm)}
                {d.assumidoPor && d.status === 'EM_ANDAMENTO' && <> · com {d.assumidoPor.nome}</>}
                {d.resolvidoEm && <> · resolvido em {formatDateTime(d.resolvidoEm)}</>}
              </div>

              {d.status === 'RESOLVIDO' && !d.emailConfirmacaoEnviadoEm && (
                <div className={styles.emailPendente}>
                  <div>O e-mail de confirmação não foi enviado ao cliente.</div>
                  <button type="button" className="btn btn-ambar btn-sm" onClick={reenviarEmail}>
                    Reenviar e-mail
                  </button>
                </div>
              )}

              {d.observacoes.length > 0 && (
                <div className={styles.historico}>
                  {d.observacoes.map((o) => (
                    <div
                      key={o.id}
                      className={o.origem === 'solicitante' ? `${styles.obs} ${styles.obsSolicitante}` : styles.obs}
                    >
                      <div className={styles.obsMeta}>
                        {o.origem === 'solicitante' && (
                          <span className={styles.obsTag}>Complemento de quem abriu</span>
                        )}
                        {o.autor.nome} · {formatDateTime(o.criadoEm)}
                      </div>
                      <div className={styles.obsTexto}>{o.texto}</div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className={styles.label} htmlFor="ch-obs">
                  Observação (visível pro próximo turno)
                </label>
                <textarea
                  id="ch-obs"
                  className={styles.textarea}
                  placeholder="Ex: carga já separada, falta só o motorista chegar..."
                  value={observacao}
                  maxLength={4000}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`btn btn-outline ${styles.obsBtn}`}
                disabled={!observacao.trim()}
                onClick={salvarObservacao}
              >
                Salvar observação
              </button>

              {d.status !== 'RESOLVIDO' && (
                <>
                  <button
                    type="button"
                    className={`btn btn-verde ${styles.resolverBtn}`}
                    onClick={() => setConfirmando(true)}
                  >
                    Marcar como resolvido
                  </button>
                  <div className={styles.hint}>
                    Ao resolver, um e-mail de confirmação é enviado ao cliente e a quem abriu o chamado.
                  </div>
                </>
              )}

              <details className={styles.original}>
                <summary>Ver e-mail original</summary>
                <pre>{d.emailOriginalTexto}</pre>
              </details>
            </div>
          </>
        )}
      </aside>

      {confirmando && d && (
        <div className={styles.overlay} role="presentation" onClick={() => setConfirmando(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-resolver"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirmar-resolver" className={styles.modalTitle}>
              Marcar como resolvido?
            </h3>
            <p className={styles.modalText}>
              Um e-mail de confirmação será enviado para <b>{d.clienteEmail}</b> e para{' '}
              <b>{d.criadoPor.nome}</b> (quem abriu o chamado). Essa ação não pode ser desfeita.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-verde" onClick={resolver}>
                Resolver e enviar e-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
