import { useMemo, useState } from 'react';
import { KM_REGISTROS } from '../mock/data';
import styles from './PageShared.module.css';

export function KmPage() {
  const [motorista, setMotorista] = useState('todos');
  const motoristas = useMemo(
    () => [...new Set(KM_REGISTROS.map((k) => k.motorista))],
    [],
  );

  const filtrados = KM_REGISTROS.filter(
    (k) => motorista === 'todos' || k.motorista === motorista,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Check-in de KM</h1>
        <p className={styles.sub}>
          Histórico dos registros enviados pelos motoristas via WhatsApp
        </p>
      </header>

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
          </tr>
        </thead>
        <tbody>
          {filtrados.map((k) => {
            const rodado = k.kmFinal != null ? k.kmFinal - k.kmInicial : null;
            return (
              <tr key={k.id}>
                <td>{k.motorista}</td>
                <td className="mono">{k.data}</td>
                <td>
                  <span className={styles.thumb} title="Foto mock" />
                  <span className="mono">{k.kmInicial.toLocaleString('pt-BR')}</span>
                </td>
                <td>
                  {k.kmFinal != null ? (
                    <>
                      <span className={`${styles.thumb} ${styles.thumbAlt}`} title="Foto mock" />
                      <span className="mono">{k.kmFinal.toLocaleString('pt-BR')}</span>
                    </>
                  ) : (
                    <span className="mono">—</span>
                  )}
                </td>
                <td className="mono">
                  {rodado != null ? `${rodado.toLocaleString('pt-BR')} km` : '—'}
                </td>
                <td>
                  <span
                    className={`${styles.badgeStatus} ${
                      k.status === 'ok' ? styles.badgeOk : styles.badgePendente
                    }`}
                  >
                    {k.status === 'ok' ? 'ok' : 'pendente de fechamento'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
