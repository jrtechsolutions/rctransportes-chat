import { useState } from 'react';
import { Modal } from '../components/Modal';
import {
  formatarChave,
  formatarCnpj,
  notaValida,
  soDigitos,
  validarNota,
} from '../lib/danfe';
import { NOTAS_COLETA } from '../mock/notasColeta';
import { usePrototype } from '../mock/PrototypeContext';
import type { NotaColeta } from '../mock/types';
import shared from './PageShared.module.css';
import styles from './NotasColetaPage.module.css';

type StatusNota = 'Validada' | 'Revisar' | 'Confirmada';

function statusNota(n: NotaColeta): StatusNota {
  if (n.confirmadaPor) return 'Confirmada';
  return notaValida(n) ? 'Validada' : 'Revisar';
}

const STATUS_CLASS: Record<StatusNota, string> = {
  Validada: shared.badgeVerde,
  Revisar: shared.badgeAmbar,
  Confirmada: shared.badgeAzul,
};

const STATUS_LABEL: Record<StatusNota, string> = {
  Validada: 'Validada',
  Revisar: 'Revisar',
  Confirmada: 'Confirmada',
};

function copiar(texto: string) {
  try {
    void navigator.clipboard?.writeText(texto);
  } catch {
    /* sem clipboard no navegador — protótipo ignora */
  }
}

export function NotasColetaPage() {
  const { usuario } = usePrototype();
  const [notas, setNotas] = useState(NOTAS_COLETA);
  const [status, setStatus] = useState('todas');
  const [tipo, setTipo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<NotaColeta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const mostrarAviso = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), 3000);
  };

  const termo = soDigitos(busca) || busca.trim().toLowerCase();
  const filtradas = notas.filter((n) => {
    if (status !== 'todas' && statusNota(n) !== status) return false;
    if (tipo !== 'todos' && n.tipoRemetente !== tipo) return false;
    if (!termo) return true;
    return (
      n.chave.includes(termo) ||
      n.cnpj.includes(termo) ||
      n.numero.includes(termo) ||
      n.emitente.toLowerCase().includes(termo) ||
      n.remetente.toLowerCase().includes(termo)
    );
  });

  const contagem = (s: StatusNota) => notas.filter((n) => statusNota(n) === s).length;

  const confirmar = (editada: NotaColeta) => {
    const nova = { ...editada, confirmadaPor: usuario.nome };
    setNotas((l) => l.map((n) => (n.id === nova.id ? nova : n)));
    setSel(null);
    mostrarAviso(`NF ${nova.numero} confirmada · chave pronta para uso`);
  };

  const pedirNovaFoto = (n: NotaColeta) => {
    setSel(null);
    mostrarAviso(`Pedido de nova foto enviado para ${n.remetente} no WhatsApp (mock)`);
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Notas de coleta</h1>
        <p className={shared.sub}>
          DANFEs enviadas por foto no WhatsApp — emitente, CNPJ, número e chave de acesso lidos
          automaticamente
        </p>
      </header>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiValor}>{notas.length}</div>
          <div className={styles.kpiLabel}>Notas recebidas</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValor}>{contagem('Validada')}</div>
          <div className={styles.kpiLabel}>Validadas automaticamente</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValor}>
            {contagem('Revisar')}
            {contagem('Revisar') > 0 && (
              <span className="badge badge-aguardando" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                Atenção
              </span>
            )}
          </div>
          <div className={styles.kpiLabel}>Para revisar</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValor}>{contagem('Confirmada')}</div>
          <div className={styles.kpiLabel}>Confirmadas manualmente</div>
        </div>
      </div>

      <div className={styles.fluxo}>
        <div className={styles.passo}>
          <span className={styles.passoNum}>1 · Chatbot</span>
          Motorista, agregado ou ajudante escolhe “Enviar DANFE”
        </div>
        <div className={styles.passo}>
          <span className={styles.passoNum}>2 · Foto</span>
          Envia a foto da nota pelo WhatsApp
        </div>
        <div className={styles.passo}>
          <span className={styles.passoNum}>3 · Leitura</span>
          Sistema lê o código de barras e, se precisar, o texto impresso (IA)
        </div>
        <div className={styles.passo}>
          <span className={styles.passoNum}>4 · Conferência</span>
          Confere a chave com CNPJ e número; se algo não bater, vai para “Revisar”
        </div>
      </div>

      {aviso && <div className={shared.aviso}>{aviso}</div>}

      <div className={shared.filters}>
        <div className={shared.filter}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="Revisar">Revisar</option>
            <option value="Validada">Validada automaticamente</option>
            <option value="Confirmada">Confirmada manualmente</option>
          </select>
        </div>
        <div className={shared.filter}>
          <label>Enviado por</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option>Motorista</option>
            <option>Agregado</option>
            <option>Ajudante</option>
          </select>
        </div>
        <div className={shared.filter}>
          <label>Buscar</label>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Chave, CNPJ, nº da NF ou empresa"
            style={{ minWidth: 260 }}
          />
        </div>
        <div className={shared.filter}>
          <label>Período</label>
          <input type="date" defaultValue="2026-11-01" />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Recebida em</th>
            <th>Enviado por</th>
            <th>Foto</th>
            <th>Empresa emitente</th>
            <th>CNPJ</th>
            <th>NF / Série</th>
            <th>Chave de acesso</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map((n) => {
            const st = statusNota(n);
            return (
              <tr key={n.id} className={shared.rowClick} onClick={() => setSel(n)}>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {n.recebidaEm}
                </td>
                <td>
                  {n.remetente}
                  <div style={{ fontSize: 11, color: 'var(--mono)' }}>{n.tipoRemetente}</div>
                </td>
                <td>
                  <span className={styles.thumbNota} title="Foto da DANFE (mock)" />
                </td>
                <td>{n.emitente}</td>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {formatarCnpj(n.cnpj)}
                </td>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {n.numero} / {n.serie}
                </td>
                <td>
                  <span className={styles.chave}>{formatarChave(n.chave)}</span>
                  {st !== 'Revisar' && (
                    <button
                      type="button"
                      className={`link-edit ${styles.copiar}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        copiar(n.chave);
                        mostrarAviso(`Chave da NF ${n.numero} copiada`);
                      }}
                    >
                      Copiar
                    </button>
                  )}
                </td>
                <td>
                  <span
                    className={`${shared.badgeStatus} ${STATUS_CLASS[st]}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {STATUS_LABEL[st]}
                  </span>
                </td>
              </tr>
            );
          })}
          {filtradas.length === 0 && (
            <tr>
              <td colSpan={8} style={{ color: 'var(--mono)', textAlign: 'center' }}>
                Nenhuma nota encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {sel && (
        <DetalheNota
          nota={sel}
          onClose={() => setSel(null)}
          onConfirmar={confirmar}
          onPedirNovaFoto={pedirNovaFoto}
          onCopiar={(c) => {
            copiar(c);
            mostrarAviso('Chave copiada');
          }}
        />
      )}
    </div>
  );
}

function DetalheNota({
  nota,
  onClose,
  onConfirmar,
  onPedirNovaFoto,
  onCopiar,
}: {
  nota: NotaColeta;
  onClose: () => void;
  onConfirmar: (n: NotaColeta) => void;
  onPedirNovaFoto: (n: NotaColeta) => void;
  onCopiar: (chave: string) => void;
}) {
  const [emitente, setEmitente] = useState(nota.emitente);
  const [cnpj, setCnpj] = useState(formatarCnpj(nota.cnpj));
  const [numero, setNumero] = useState(nota.numero);
  const [serie, setSerie] = useState(nota.serie);
  const [chave, setChave] = useState(formatarChave(nota.chave));

  const checks = validarNota({ chave, cnpj, numero });
  const tudoOk = checks.every((c) => c.ok === true);
  const [cChave, cDv, , cCnpj, cNumero] = checks;
  const erroChave = cChave.ok === false || cDv.ok === false;
  const original = statusNota(nota);

  return (
    <Modal title={`DANFE · NF ${nota.numero}`} onClose={onClose} extraWide>
      <div className={styles.detalhe}>
        <div>
          <div className={styles.foto}>
            <div
              className={`${styles.papel} ${original === 'Revisar' ? styles.papelBorrado : ''} ${
                soDigitos(nota.chave).length < 44 ? styles.papelCortado : ''
              }`}
            >
              <div className={styles.papelTopo}>
                <div>
                  <div className={styles.papelEmitente}>{nota.emitente.toUpperCase()}</div>
                  <div>CNPJ {formatarCnpj(nota.cnpj)}</div>
                  <div>Rua Industrial, 1200 · SP</div>
                </div>
                <div className={styles.papelDanfe}>
                  DANFE
                  <div style={{ fontWeight: 400, fontSize: 8 }}>
                    Nº {nota.numero.padStart(9, '0').replace(/(\d{3})(?=\d)/g, '$1.')}
                    <br />
                    Série {nota.serie}
                  </div>
                </div>
              </div>
              <div className={styles.barras} />
              <div className={styles.papelChave}>CHAVE DE ACESSO {formatarChave(nota.chave)}</div>
              <div className={styles.papelLinhas} />
            </div>
          </div>

          <div className={styles.conversa}>
            <div className={styles.bot}>Envie a foto da DANFE, por favor. Enquadre a nota inteira.</div>
            <div className={styles.motorista}>[foto] · {nota.recebidaEm.split(' ')[1]}</div>
            <div className={styles.bot}>
              {original === 'Revisar'
                ? 'Recebido! Vamos conferir os dados da nota e te avisamos se precisar de outra foto.'
                : `Recebido! NF ${nota.numero} da ${nota.emitente} registrada.`}
            </div>
          </div>
        </div>

        <div>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--mono)' }}>
            Enviada por <strong>{nota.remetente}</strong> ({nota.tipoRemetente}) · {nota.telefone} ·{' '}
            {nota.recebidaEm}
            <br />
            Leitura: <span className={`badge ${shared.badgeCinza}`}>{nota.leitura}</span>
            {nota.confirmadaPor && <> · confirmada por {nota.confirmadaPor}</>}
          </p>

          <div className="field">
            <label>Empresa emitente</label>
            <input value={emitente} onChange={(e) => setEmitente(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.6fr)', gap: 12 }}>
            <div className="field">
              <label>CNPJ</label>
              <input
                className={`mono ${cCnpj.ok === false ? styles.campoErro : ''}`}
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Nº da NF</label>
              <input
                className={`mono ${cNumero.ok === false ? styles.campoErro : ''}`}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Série</label>
              <input className="mono" value={serie} onChange={(e) => setSerie(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Chave de acesso</label>
            <textarea
              rows={2}
              className={`mono ${erroChave ? styles.campoErro : ''}`}
              value={chave}
              onChange={(e) => setChave(e.target.value)}
            />
          </div>

          <h3 className={shared.sectionTitle} style={{ marginTop: 4 }}>
            Conferência automática
          </h3>
          <ul className={styles.checks}>
            {checks.map((c) => (
              <li key={c.label}>
                <span
                  className={`${styles.checkIcon} ${
                    c.ok === true ? styles.checkOk : c.ok === false ? styles.checkErro : styles.checkNa
                  }`}
                >
                  {c.ok === true ? '✓' : c.ok === false ? '✕' : '–'}
                </span>
                {c.label}
              </li>
            ))}
          </ul>

          {!tudoOk && (
            <p className={styles.hintErro}>
              Corrija os campos em vermelho olhando a foto, ou peça uma nova foto ao{' '}
              {nota.tipoRemetente.toLowerCase()}.
            </p>
          )}

          <div className={shared.modalActions} style={{ flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={() => onPedirNovaFoto(nota)}>
              Pedir nova foto
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={!tudoOk}
              onClick={() => onCopiar(soDigitos(chave))}
            >
              Copiar chave
            </button>
            <button
              type="button"
              className="btn btn-verde"
              disabled={!tudoOk}
              onClick={() =>
                onConfirmar({
                  ...nota,
                  emitente,
                  cnpj: soDigitos(cnpj),
                  numero: soDigitos(numero),
                  serie,
                  chave: soDigitos(chave),
                })
              }
            >
              Confirmar dados
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
