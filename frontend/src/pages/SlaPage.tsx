import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSetoresFromDb } from '../hooks/useSetoresFromDb';
import shared from '../styles/SupervisorShared.module.css';
import styles from './SlaPage.module.css';

export function SlaPage() {
  const { setores: lista, loading, reload } = useSetoresFromDb();
  const [valores, setValores] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, number> = {};
    for (const s of lista) {
      map[s.id] = s.slaMinutos ?? 15;
    }
    setValores(map);
  }, [lista]);

  const salvar = async (id: string) => {
    setError(null);
    setMsg(null);
    setSalvando(id);
    try {
      await api(`/setores/${id}/sla`, {
        method: 'PATCH',
        body: JSON.stringify({ slaMinutos: valores[id] }),
      });
      setMsg('SLA salvo.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSalvando(null);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>SLA</h1>
        <p className={shared.sub}>
          Tempo limite de espera por setor antes do alerta de atraso
        </p>
      </header>

      {msg && <p className={styles.ok}>{msg}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={shared.tableCard}>
        <table className="table">
          <thead>
            <tr>
              <th>Setor</th>
              <th>Tempo limite</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3}>Carregando setores…</td>
              </tr>
            )}
            {!loading &&
              lista.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.nome}</strong>
                  </td>
                  <td>
                    <div className={styles.inlineField}>
                      <input
                        type="number"
                        min={1}
                        max={1440}
                        value={valores[s.id] ?? 15}
                        onChange={(e) =>
                          setValores((v) => ({ ...v, [s.id]: Number(e.target.value) }))
                        }
                      />
                      <span>minutos</span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ambar btn-sm"
                      disabled={salvando === s.id}
                      onClick={() => void salvar(s.id)}
                    >
                      {salvando === s.id ? 'Salvando…' : 'Salvar'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.note}>
        O SLA de uma conversa de cliente recalcula a cada mensagem nova sem resposta — não conta o
        tempo desde o início da conversa, só desde a última mensagem em aberto.
      </div>
    </div>
  );
}
