import { useState } from 'react';
import { AGENTES_POR_SETOR, SETORES, SLA_POR_SETOR } from '../mock/data';
import styles from './PageShared.module.css';

export function ConfigSetorPage() {
  const [setor, setSetor] = useState<string>('Operacional');
  const [agentes, setAgentes] = useState(() =>
    Object.fromEntries(
      Object.entries(AGENTES_POR_SETOR).map(([s, list]) => [
        s,
        list.map((a) => ({ ...a })),
      ]),
    ),
  );
  const [sla, setSla] = useState({ ...SLA_POR_SETOR });
  const [salvo, setSalvo] = useState(false);

  const lista = agentes[setor] ?? [];

  const setLimite = (id: string, limite: number) => {
    setAgentes((prev) => ({
      ...prev,
      [setor]: prev[setor].map((a) => (a.id === id ? { ...a, limite } : a)),
    }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configurações de setor</h1>
        <p className={styles.sub}>Limites de atendimento simultâneo e SLA por setor</p>
      </header>

      <div className={styles.card}>
        <div className="field" style={{ maxWidth: 280 }}>
          <label htmlFor="setor-sel">Setor</label>
          <select id="setor-sel" value={setor} onChange={(e) => setSetor(e.target.value)}>
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.aviso}>
          Jundiaí escala para Matriz usando este mesmo SLA e limites de atendimento.
        </div>

        <div className="field" style={{ maxWidth: 200 }}>
          <label htmlFor="sla">Tempo de SLA (minutos)</label>
          <input
            id="sla"
            type="number"
            min={1}
            value={sla[setor]}
            onChange={(e) => setSla((s) => ({ ...s, [setor]: Number(e.target.value) || 1 }))}
          />
        </div>

        <h2 className={styles.sectionTitle}>Agentes do setor</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Limite de atendimentos simultâneos</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id}>
                <td>{a.nome}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={a.limite}
                    onChange={(e) => setLimite(a.id, Number(e.target.value) || 1)}
                    style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--borda)' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn btn-ambar"
            onClick={() => {
              setSalvo(true);
              setTimeout(() => setSalvo(false), 2500);
            }}
          >
            Salvar configurações
          </button>
          {salvo && <span className={styles.salvo}>Salvo (mock — não persiste)</span>}
        </div>
      </div>
    </div>
  );
}
