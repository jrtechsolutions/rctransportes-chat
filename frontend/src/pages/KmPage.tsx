import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { KM_REGISTROS } from '../mock/data';
import { usePrototype } from '../mock/PrototypeContext';
import type { KmRegistro } from '../mock/types';
import styles from './PageShared.module.css';

/** Acima disso num dia, provavelmente a foto foi lida errado */
const KM_DIA_SUSPEITO = 1500;

function leituraSuspeita(k: KmRegistro): boolean {
  if (k.kmFinal == null) return false;
  const rodado = k.kmFinal - k.kmInicial;
  return rodado < 0 || rodado > KM_DIA_SUSPEITO;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function KmPage() {
  const { usuario } = usePrototype();
  const [itens, setItens] = useState(KM_REGISTROS);
  const [motorista, setMotorista] = useState('todos');
  const [editando, setEditando] = useState<KmRegistro | null>(null);
  const motoristas = useMemo(
    () => [...new Set(KM_REGISTROS.map((k) => k.motorista))],
    [],
  );

  const filtrados = itens.filter(
    (k) => motorista === 'todos' || k.motorista === motorista,
  );
  const suspeitos = itens.filter(leituraSuspeita).length;

  const salvar = (k: KmRegistro, kmInicial: number, kmFinal: number | null, motivo: string) => {
    setItens((l) =>
      l.map((x) =>
        x.id === k.id
          ? {
              ...x,
              kmInicial,
              kmFinal,
              status: kmFinal == null ? 'pendente' : 'ok',
              correcao: {
                por: usuario.nome,
                quando: new Date().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                motivo,
                // Guarda sempre o que o sistema leu da foto, mesmo depois de várias correções
                lidoInicial: x.correcao?.lidoInicial ?? x.kmInicial,
                lidoFinal: x.correcao ? x.correcao.lidoFinal : x.kmFinal,
              },
            }
          : x,
      ),
    );
    setEditando(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Check-in de KM</h1>
        <p className={styles.sub}>
          Histórico dos registros enviados pelos motoristas via WhatsApp
        </p>
      </header>

      {suspeitos > 0 && (
        <div className={styles.notaIndep}>
          {suspeitos === 1
            ? '1 registro parece ter sido lido errado'
            : `${suspeitos} registros parecem ter sido lidos errado`}{' '}
          da foto (km rodado negativo ou acima de {fmt(KM_DIA_SUSPEITO)} km no dia). Confira a foto e
          corrija em “Editar”.
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filter}>
          <label>Motorista</label>
          <select value={motorista} onChange={(e) => setMotorista(e.target.value)}>
            <option value="todos">Todos</option>
            {motoristas.map((m) => (
              <option key={m} value={m}>
                {m}
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
            <th>Motorista / Agregado</th>
            <th>Data</th>
            <th>KM inicial</th>
            <th>KM final</th>
            <th>KM rodado</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((k) => {
            const rodado = k.kmFinal != null ? k.kmFinal - k.kmInicial : null;
            const suspeito = leituraSuspeita(k);
            return (
              <tr key={k.id} className={suspeito ? styles.rowVencida : undefined}>
                <td>{k.motorista}</td>
                <td className="mono">{k.data}</td>
                <td>
                  <span className={styles.thumb} title="Foto mock" />
                  <span className="mono">{fmt(k.kmInicial)}</span>
                </td>
                <td>
                  {k.kmFinal != null ? (
                    <>
                      <span className={`${styles.thumb} ${styles.thumbAlt}`} title="Foto mock" />
                      <span className="mono">{fmt(k.kmFinal)}</span>
                    </>
                  ) : (
                    <span className="mono">—</span>
                  )}
                </td>
                <td className="mono">
                  {rodado != null ? `${fmt(rodado)} km` : '—'}
                </td>
                <td>
                  {suspeito ? (
                    <span className={`${styles.badgeStatus} ${styles.badgeVermelho}`}>verificar leitura</span>
                  ) : (
                    <span
                      className={`${styles.badgeStatus} ${
                        k.status === 'ok' ? styles.badgeOk : styles.badgePendente
                      }`}
                    >
                      {k.status === 'ok' ? 'ok' : 'pendente de fechamento'}
                    </span>
                  )}
                  {k.correcao && (
                    <div
                      style={{ fontSize: 11, color: 'var(--mono)', marginTop: 4 }}
                      title={`Motivo: ${k.correcao.motivo}`}
                    >
                      corrigido por {k.correcao.por.split(' ')[0]} · {k.correcao.quando}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditando(k)}>
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editando && (
        <EditarKmModal registro={editando} onClose={() => setEditando(null)} onSalvar={salvar} />
      )}
    </div>
  );
}

function EditarKmModal({
  registro: k,
  onClose,
  onSalvar,
}: {
  registro: KmRegistro;
  onClose: () => void;
  onSalvar: (k: KmRegistro, kmInicial: number, kmFinal: number | null, motivo: string) => void;
}) {
  const [inicial, setInicial] = useState(String(k.kmInicial));
  const [final, setFinal] = useState(k.kmFinal != null ? String(k.kmFinal) : '');
  const [motivo, setMotivo] = useState('');

  const num = (v: string) => Number(v.replace(/\D/g, ''));
  const kmIni = num(inicial);
  const kmFim = final.trim() ? num(final) : null;
  const rodado = kmFim != null ? kmFim - kmIni : null;
  const mudou = kmIni !== k.kmInicial || kmFim !== k.kmFinal;

  const erro =
    !inicial.trim() || kmIni <= 0
      ? 'Informe o km inicial'
      : rodado != null && rodado < 0
        ? 'O km final não pode ser menor que o inicial'
        : null;
  const alerta = rodado != null && rodado > KM_DIA_SUSPEITO ? `${fmt(rodado)} km no dia — confira se está certo` : null;

  const lidoIni = k.correcao?.lidoInicial ?? k.kmInicial;
  const lidoFim = k.correcao ? k.correcao.lidoFinal : k.kmFinal;
  const fotoIni = k.fotoMock?.inicial ?? lidoIni;
  const fotoFim = k.fotoMock?.final ?? lidoFim;

  return (
    <Modal title={`Corrigir KM · ${k.motorista} · ${k.data}`} onClose={onClose} wide>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--mono)' }}>
        Confira as fotos do odômetro e ajuste o número se o sistema leu errado. A correção fica registrada
        com seu nome no log de auditoria.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <div>
          <div className={styles.fotoOdometro}>
            <span className="mono">{String(fotoIni)}</span>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>KM inicial *</label>
            <input className="mono" inputMode="numeric" value={inicial} onChange={(e) => setInicial(e.target.value)} />
            <span className="hint">Lido pelo sistema: {fmt(lidoIni)}</span>
          </div>
        </div>
        <div>
          <div className={`${styles.fotoOdometro} ${fotoFim == null ? styles.fotoVazia : ''}`}>
            <span className="mono">{fotoFim != null ? String(fotoFim) : 'sem foto'}</span>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>KM final</label>
            <input
              className="mono"
              inputMode="numeric"
              value={final}
              onChange={(e) => setFinal(e.target.value)}
              placeholder="Ainda não enviado"
            />
            <span className="hint">
              {lidoFim != null ? `Lido pelo sistema: ${fmt(lidoFim)}` : 'Motorista ainda não enviou o km final'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.aviso} style={{ marginBottom: 12 }}>
        KM rodado: <strong className="mono">{rodado != null ? `${fmt(rodado)} km` : '—'}</strong>
      </div>
      {erro && <p style={{ color: 'var(--erro-d)', fontSize: 13, margin: '0 0 12px' }}>{erro}</p>}
      {!erro && alerta && <p style={{ color: 'var(--ambar-d)', fontSize: 13, margin: '0 0 12px' }}>{alerta}</p>}

      <div className="field">
        <label>Motivo da correção *</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: foto com reflexo, sistema leu 8 no lugar de 3"
        />
      </div>

      <div className={styles.modalActions}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-verde"
          disabled={!!erro || !mudou || !motivo.trim()}
          onClick={() => onSalvar(k, kmIni, kmFim, motivo.trim())}
        >
          Salvar correção
        </button>
      </div>
    </Modal>
  );
}
