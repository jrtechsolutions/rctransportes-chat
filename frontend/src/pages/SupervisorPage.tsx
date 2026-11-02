import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import shared from '../styles/SupervisorShared.module.css';
import styles from './SupervisorPage.module.css';

type Indicadores = {
  aguardando: number;
  emAtendimento: number;
  slaEstourado: number;
  encerradasHoje: number;
  filas: Array<{
    id: string;
    nome: string;
    slaMinutos: number;
    aguardando: number;
    emAtendimento: number;
    slaEstourado: number;
  }>;
};

export function SupervisorPage() {
  const [data, setData] = useState<Indicadores | null>(null);

  useEffect(() => {
    const load = async () => {
      setData(await api<Indicadores>('/supervisor/indicadores'));
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!data) {
    return (
      <div className={shared.page}>
        <p>Carregando painel…</p>
      </div>
    );
  }

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Visão geral</h1>
        <p className={shared.sub}>Todos os setores</p>
      </header>

      <div className={styles.cards}>
        <div className={`${styles.metric} ${styles.borderAmbar}`}>
          <strong className={styles.metricValue}>{data.aguardando}</strong>
          <span className={styles.metricLabel}>Aguardando</span>
        </div>
        <div className={`${styles.metric} ${styles.borderAzul}`}>
          <strong className={styles.metricValue}>{data.emAtendimento}</strong>
          <span className={styles.metricLabel}>Em atendimento</span>
        </div>
        <div className={`${styles.metric} ${styles.borderErro}`}>
          <strong className={styles.metricValue}>{data.slaEstourado}</strong>
          <span className={styles.metricLabel}>SLA estourado</span>
        </div>
        <div className={`${styles.metric} ${styles.borderVerde}`}>
          <strong className={styles.metricValue}>{data.encerradasHoje}</strong>
          <span className={styles.metricLabel}>Encerradas hoje</span>
        </div>
      </div>

      <section>
        <h2 className={shared.sectionTitle}>Filas por setor</h2>
        <div className={shared.tableCard}>
          <table className="table">
            <thead>
              <tr>
                <th>Setor</th>
                <th>Aguardando</th>
                <th>Em atend.</th>
                <th>SLA médio</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.filas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.nome}</strong>
                  </td>
                  <td>{f.aguardando}</td>
                  <td>{f.emAtendimento}</td>
                  <td>
                    <span className={f.slaEstourado > 0 ? styles.slaAlert : 'mono'}>
                      {f.slaMinutos} min
                    </span>
                  </td>
                  <td>
                    <Link to="/sla" className={styles.configBtn}>
                      Configurar SLA
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
