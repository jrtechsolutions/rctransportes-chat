import { useState } from 'react';
import { FALHAS_INTEGRACAO } from '../mock/data';
import type { FalhaIntegracao } from '../mock/types';
import styles from './PageShared.module.css';

const TIPO_CLASS: Record<FalhaIntegracao['tipo'], string> = {
  'Mensagem não entregue': styles.badgeVermelho,
  'Webhook não processado': styles.badgeAmbar,
  'Timeout da API': styles.badgeAzul,
};

const STATUS_CLASS: Record<FalhaIntegracao['status'], string> = {
  'Pendente de revisão': styles.badgeAmbar,
  Reprocessado: styles.badgeVerde,
  Ignorado: styles.badgeCinza,
};

function truncar(texto: string, max = 48) {
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}...` : texto;
}

export function FalhasIntegracaoPage() {
  const [aviso, setAviso] = useState<string | null>(null);

  const reprocessar = (f: FalhaIntegracao) => {
    setAviso(`Reprocessamento solicitado · ${f.dataHora} · ${f.numeroOrigem} (mock)`);
    setTimeout(() => setAviso(null), 2500);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Falhas de integração</h1>
        <p className={styles.sub}>
          Mensagens e eventos do WhatsApp que não foram processados · visível só para Administrador
        </p>
      </header>

      {aviso && <div className={styles.aviso}>{aviso}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Data/hora</th>
            <th>Número de origem</th>
            <th>Tipo de falha</th>
            <th>Conteúdo da mensagem</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {FALHAS_INTEGRACAO.map((f) => (
            <tr key={f.id}>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>{f.dataHora}</td>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>{f.numeroOrigem}</td>
              <td>
                <span className={`badge ${TIPO_CLASS[f.tipo]}`} style={{ whiteSpace: 'nowrap' }}>{f.tipo}</span>
              </td>
              <td title={f.conteudo}>{truncar(f.conteudo)}</td>
              <td>
                <span className={`${styles.badgeStatus} ${STATUS_CLASS[f.status]}`} style={{ whiteSpace: 'nowrap' }}>{f.status}</span>
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => reprocessar(f)}>
                  Tentar reprocessar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
