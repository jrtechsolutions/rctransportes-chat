import { useState } from 'react';
import { RELATORIOS } from '../mock/data';
import styles from './RelatoriosPage.module.css';

export function RelatoriosPage() {
  const [toast, setToast] = useState<string | null>(null);

  const exportar = (titulo: string, tipo: 'Excel' | 'PDF') => {
    setToast(`${tipo} · ${titulo} (mock — nenhum arquivo gerado)`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
        <p className={styles.sub}>Exportações prontas para Excel e PDF</p>
      </header>

      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.grid}>
        {RELATORIOS.map((r) => (
          <div key={r.id} className={styles.card}>
            <div className={styles.icon} aria-hidden>
              ▦
            </div>
            <h2>{r.titulo}</h2>
            <p>{r.desc}</p>
            <div className={styles.actions}>
              <span className={styles.exportLabel}>Exportar</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => exportar(r.titulo, 'Excel')}>
                Excel
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportar(r.titulo, 'PDF')}>
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
