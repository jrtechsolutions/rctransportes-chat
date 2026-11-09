import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { statusChamadoLabel, tempoDesde } from '../lib/chamados';
import { formatDateTime } from '../lib/sanitize';
import { useChamados } from '../mock/ChamadosContext';
import { usePrototype } from '../mock/PrototypeContext';
import { UNIDADES_EXPEDICAO, type ChamadoMock, type UnidadeExpedicao } from '../mock/types';
import shared from './PageShared.module.css';
import styles from './AbrirChamado.module.css';

const STATUS_CLASS: Record<ChamadoMock['status'], string> = {
  ABERTO: shared.badgeAmbar,
  EM_ANDAMENTO: shared.badgeAzul,
  RESOLVIDO: shared.badgeVerde,
};

const VEICULOS = ['Toco', 'Truck', 'Bitrem', 'Carreta', 'VUC', 'HR'] as const;

type UnidadePeso = 'kg' | 't';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Formata Date → valor de input datetime-local (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function atalhoHoje14(): string {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  return toDatetimeLocal(d);
}

function atalhoAmanha8(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return toDatetimeLocal(d);
}

function atalhoEm2h(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return toDatetimeLocal(d);
}

function formatarCorte(isoLocal: string): string {
  if (!isoLocal) return '';
  const d = new Date(isoLocal);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AbrirChamado() {
  const { usuario } = usePrototype();
  const { chamados, setChamados } = useChamados();
  const [selId, setSelId] = useState<string | null>(null);
  const [expedicao, setExpedicao] = useState<UnidadeExpedicao | ''>('');
  const [cliente, setCliente] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [peso, setPeso] = useState('');
  const [unidade, setUnidade] = useState<UnidadePeso>('kg');
  const [horarioCorte, setHorarioCorte] = useState('');
  const [emailOriginal, setEmailOriginal] = useState('');
  const [criando, setCriando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const pesoNum = Number(String(peso).replace(',', '.'));
  const podeCriar =
    expedicao !== '' &&
    cliente.trim().length > 0 &&
    tipoVeiculo.length > 0 &&
    peso.trim().length > 0 &&
    !Number.isNaN(pesoNum) &&
    pesoNum > 0 &&
    horarioCorte.length > 0;

  const criar = (e: FormEvent) => {
    e.preventDefault();
    if (!podeCriar || !expedicao) return;
    setCriando(true);
    window.setTimeout(() => {
      const pesoLabel = `${peso.replace('.', ',')} ${unidade === 't' ? 't' : 'kg'}`;
      const agora = new Date().toISOString();
      const novo: ChamadoMock = {
        id: `ch-${Date.now()}`,
        clienteNome: cliente.trim(),
        clienteEmail: '(e-mail do cliente não informado)',
        destino: 'A definir',
        notaFiscal: null,
        tipoVeiculo,
        peso: pesoLabel,
        horarioLimite: formatarCorte(horarioCorte),
        unidade: expedicao,
        status: 'ABERTO',
        criadoPorId: usuario.id,
        assumidoPorId: null,
        resolvidoEm: null,
        emailConfirmacaoEnviadoEm: null,
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: { id: usuario.id, nome: usuario.nome, email: usuario.email },
        assumidoPor: null,
        emailOriginalTexto: emailOriginal.trim() || '(sem e-mail original)',
        observacoes: [],
      };
      setChamados((l) => [novo, ...l]);
      setSucesso(
        `Chamado de ${cliente.trim()} criado para a expedição ${expedicao === 'Matriz' ? 'da Matriz' : 'da Filial'} — ${tipoVeiculo}, ${pesoLabel}, corte ${formatarCorte(horarioCorte)}. Já está no painel e na sua lista de chamados.`,
      );
      setExpedicao('');
      setCliente('');
      setTipoVeiculo('');
      setPeso('');
      setUnidade('kg');
      setHorarioCorte('');
      setEmailOriginal('');
      setCriando(false);
    }, 350);
  };

  const ordemStatus = { ABERTO: 0, EM_ANDAMENTO: 1, RESOLVIDO: 2 } as const;
  const meus = chamados
    .filter((c) => c.criadoPorId === usuario.id)
    .sort(
      (a, b) =>
        ordemStatus[a.status] - ordemStatus[b.status] ||
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  const sel = chamados.find((c) => c.id === selId) ?? null;

  const adicionarComplemento = (texto: string) => {
    if (!sel) return;
    const agora = new Date().toISOString();
    setChamados((l) =>
      l.map((c) =>
        c.id === sel.id
          ? {
              ...c,
              atualizadoEm: agora,
              complementoNovo: true,
              observacoes: [
                ...c.observacoes,
                {
                  id: `obs-${Date.now()}`,
                  chamadoId: c.id,
                  autorId: usuario.id,
                  texto,
                  criadoEm: agora,
                  autor: { id: usuario.id, nome: usuario.nome },
                  origem: 'solicitante',
                },
              ],
            }
          : c,
      ),
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Abrir chamado</h1>
        <div className={styles.sub}>Preencha os dados da carga para enviar à expedição</div>
      </header>

      {sucesso && (
        <div className={styles.alertas}>
          <div className={styles.sucesso}>{sucesso}</div>
        </div>
      )}

      <div className={styles.body}>
        <form className={styles.card} onSubmit={criar}>
          <div className={styles.fields}>
            <div>
              <span className={styles.label}>Expedição de destino *</span>
              <div className={styles.unidades} role="group" aria-label="Expedição de destino">
                {UNIDADES_EXPEDICAO.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={expedicao === u ? styles.unidadeAtiva : styles.unidadeBtn}
                    onClick={() => setExpedicao(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-cliente">
                Cliente *
              </label>
              <input
                id="ch-cliente"
                className={styles.input}
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nome do cliente"
                maxLength={200}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-veiculo">
                Tipo de veículo *
              </label>
              <select
                id="ch-veiculo"
                className={styles.input}
                value={tipoVeiculo}
                onChange={(e) => setTipoVeiculo(e.target.value)}
              >
                <option value="">Selecione…</option>
                {VEICULOS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-peso">
                Peso *
              </label>
              <div className={styles.pesoRow}>
                <input
                  id="ch-peso"
                  className={`${styles.input} ${styles.pesoInput}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="0"
                />
                <div className={styles.unidadeToggle} role="group" aria-label="Unidade de peso">
                  <button
                    type="button"
                    className={unidade === 'kg' ? styles.unidadeAtiva : styles.unidadeBtn}
                    onClick={() => setUnidade('kg')}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={unidade === 't' ? styles.unidadeAtiva : styles.unidadeBtn}
                    onClick={() => setUnidade('t')}
                  >
                    toneladas
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-corte">
                Horário de corte *
              </label>
              <div className={styles.atalhos}>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoHoje14())}
                >
                  Hoje 14h
                </button>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoAmanha8())}
                >
                  Amanhã 8h
                </button>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoEm2h())}
                >
                  Em 2h
                </button>
              </div>
              <input
                id="ch-corte"
                className={`${styles.input} ${styles.mono}`}
                type="datetime-local"
                value={horarioCorte}
                onChange={(e) => setHorarioCorte(e.target.value)}
              />
            </div>

            <div className={styles.emailBox}>
              <label className={styles.label} htmlFor="ch-email-ref">
                E-mail original <span className={styles.opcional}>(opcional)</span>
              </label>
              <p className={styles.emailHint}>
                Cole aqui o e-mail original, se quiser manter como referência. Fica guardado junto do
                chamado — sem análise automática.
              </p>
              <textarea
                id="ch-email-ref"
                className={styles.textarea}
                value={emailOriginal}
                onChange={(e) => setEmailOriginal(e.target.value)}
                placeholder="Cole aqui o e-mail original, se quiser manter como referência"
                rows={5}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-ambar ${styles.fullBtn} ${styles.criarBtn}`}
            disabled={!podeCriar || criando}
          >
            {criando ? 'Criando…' : 'Criar chamado'}
          </button>
        </form>

        <section className={styles.meus}>
          <div className={styles.meusHeader}>
            <h2 className={styles.meusTitle}>Meus chamados</h2>
            <span className={styles.meusSub}>
              {meus.filter((c) => c.status !== 'RESOLVIDO').length} em aberto · {meus.length} no total
            </span>
          </div>
          {meus.length === 0 && (
            <p className={styles.meusVazio}>Os chamados que você abrir aparecem aqui para acompanhar.</p>
          )}
          {meus.map((c) => {
            const complementos = c.observacoes.filter((o) => o.origem === 'solicitante').length;
            return (
              <button key={c.id} type="button" className={styles.meuItem} onClick={() => setSelId(c.id)}>
                <div className={styles.meuMain}>
                  <div className={styles.meuNome}>
                    {c.clienteNome}
                    <span className={styles.unidadeTag}>{c.unidade}</span>
                  </div>
                  <div className={styles.meuResumo}>
                    {c.tipoVeiculo} {c.peso} · limite {c.horarioLimite}
                  </div>
                  <div className={styles.meuMeta}>
                    aberto {tempoDesde(c.criadoEm)}
                    {c.assumidoPor && c.status !== 'RESOLVIDO' && <> · com {c.assumidoPor.nome}</>}
                    {complementos > 0 && (
                      <> · {complementos} {complementos === 1 ? 'complemento' : 'complementos'}</>
                    )}
                  </div>
                </div>
                <span className={`${shared.badgeStatus} ${STATUS_CLASS[c.status]}`}>
                  {statusChamadoLabel(c.status)}
                </span>
              </button>
            );
          })}
        </section>
      </div>

      {sel && (
        <DetalheMeuChamado chamado={sel} onClose={() => setSelId(null)} onComplementar={adicionarComplemento} />
      )}
    </div>
  );
}

/** Visão de quem abriu: dados só leitura + complementos, como um acompanhamento no GLPI */
function DetalheMeuChamado({
  chamado: c,
  onClose,
  onComplementar,
}: {
  chamado: ChamadoMock;
  onClose: () => void;
  onComplementar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const complementos = c.observacoes.filter((o) => o.origem === 'solicitante');
  const resolvido = c.status === 'RESOLVIDO';

  const enviar = () => {
    if (!texto.trim()) return;
    onComplementar(texto.trim());
    setTexto('');
    setEnviado(true);
    window.setTimeout(() => setEnviado(false), 2500);
  };

  return (
    <Modal title={c.clienteNome} onClose={onClose} wide>
      <div className={styles.detStatus}>
        <span className={`${shared.badgeStatus} ${STATUS_CLASS[c.status]}`}>{statusChamadoLabel(c.status)}</span>
        <span className={styles.meuMeta}>
          {c.status === 'ABERTO' && 'Aguardando a expedição assumir'}
          {c.status === 'EM_ANDAMENTO' && c.assumidoPor && `Sendo trabalhado por ${c.assumidoPor.nome}`}
          {resolvido && c.resolvidoEm && `Resolvido em ${formatDateTime(c.resolvidoEm)}`}
        </span>
      </div>

      <div className={styles.detGrid}>
        <div>
          <span className={styles.label}>Expedição</span>
          <b>{c.unidade}</b>
        </div>
        <div>
          <span className={styles.label}>Veículo</span>
          <b>{c.tipoVeiculo}</b>
        </div>
        <div>
          <span className={styles.label}>Peso</span>
          <b>{c.peso}</b>
        </div>
        <div>
          <span className={styles.label}>Horário de corte</span>
          <b>{c.horarioLimite}</b>
        </div>
        <div>
          <span className={styles.label}>Destino</span>
          <b>{c.destino}</b>
        </div>
        <div>
          <span className={styles.label}>Nota fiscal</span>
          <b>{c.notaFiscal ?? '—'}</b>
        </div>
        <div>
          <span className={styles.label}>Aberto em</span>
          <b>{formatDateTime(c.criadoEm)}</b>
        </div>
      </div>

      <p className={styles.detAviso}>
        Os dados do chamado não podem ser alterados por aqui. Para passar uma informação nova à expedição,
        adicione um complemento.
      </p>

      <h3 className={shared.sectionTitle}>Andamento</h3>
      <ul className={shared.timeline}>
        <li>
          <span className={shared.timelineQuando}>{formatDateTime(c.criadoEm)}</span>
          Chamado aberto por {c.criadoPor.nome}
        </li>
        {c.assumidoPor && (
          <li>
            <span className={shared.timelineQuando}>expedição</span>
            Assumido por {c.assumidoPor.nome}
          </li>
        )}
        {complementos.map((o) => (
          <li key={o.id}>
            <span className={shared.timelineQuando}>{formatDateTime(o.criadoEm)}</span>
            <b>Complemento</b> · {o.autor.nome}
            <div className={styles.complementoTexto}>{o.texto}</div>
          </li>
        ))}
        {resolvido && c.resolvidoEm && (
          <li>
            <span className={shared.timelineQuando}>{formatDateTime(c.resolvidoEm)}</span>
            Resolvido — e-mail de confirmação enviado
          </li>
        )}
      </ul>

      {resolvido ? (
        <p className={styles.detAviso}>Chamado resolvido. Para uma nova solicitação, abra outro chamado.</p>
      ) : (
        <div className="field">
          <label htmlFor="complemento">Adicionar complemento</label>
          <textarea
            id="complemento"
            rows={3}
            value={texto}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: cliente pediu para entrar pela portaria 2; carga liberada só após as 13h…"
          />
          <div className={styles.complementoAcoes}>
            {enviado && <span className={shared.salvo}>Complemento enviado à expedição</span>}
            <button type="button" className="btn btn-ambar" disabled={!texto.trim()} onClick={enviar}>
              Enviar complemento
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
