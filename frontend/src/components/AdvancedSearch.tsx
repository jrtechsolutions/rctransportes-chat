import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSCA_RESULTADOS } from '../mock/data';
import styles from './AdvancedSearch.module.css';

export function AdvancedSearch() {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.icon} aria-hidden>
          ⌕
        </span>
        Busca avançada…
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <strong>Busca avançada</strong>
            <button type="button" className="link-edit" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          <div className={styles.grid}>
            <div className="field">
              <label>Nome</label>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do contato" />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input placeholder="(19) 9xxxx-xxxx" />
            </div>
            <div className="field">
              <label>Protocolo</label>
              <input className="mono" placeholder="OC-2026-…" />
            </div>
            <div className="field">
              <label>NF</label>
              <input className="mono" placeholder="Nota fiscal" />
            </div>
            <div className="field">
              <label>CT-e</label>
              <input className="mono" placeholder="CT-e" />
            </div>
            <div className="field">
              <label>Placa</label>
              <input className="mono" placeholder="ABC1D23" />
            </div>
            <div className="field">
              <label>Pedido / viagem</label>
              <input placeholder="Nº pedido ou viagem" />
            </div>
            <div className="field">
              <label>Motivo</label>
              <input placeholder="Motivo do contato" />
            </div>
            <div className="field">
              <label>Resultado</label>
              <input placeholder="Resultado do atendimento" />
            </div>
            <div className="field">
              <label>Responsável</label>
              <input placeholder="Agente" />
            </div>
            <div className="field">
              <label>Período</label>
              <input type="date" />
            </div>
          </div>

          <div className={styles.results}>
            <div className={styles.resultsLabel}>Resultados de exemplo</div>
            {BUSCA_RESULTADOS.map((r) => (
              <div key={r.id} className={styles.resultItem}>
                <div>
                  <span className={`${styles.tipo} ${styles[`tipo_${r.tipo}`]}`}>{r.tipo}</span>
                  <strong>{r.titulo}</strong>
                  <div className={styles.detalhe}>{r.detalhe}</div>
                </div>
                <Link to={r.href} className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
