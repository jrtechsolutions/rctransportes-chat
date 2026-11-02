import { NUMEROS_WHATSAPP } from '../mock/data';
import styles from './PageShared.module.css';

const MODO_CLASS: Record<(typeof NUMEROS_WHATSAPP)[number]['modo'], string> = {
  'Direto (sem menu)': styles.badgeVerde,
  'Menu do chatbot (número central)': styles.badgeAzul,
  'Identificação automática por texto/número': styles.badgeAmbar,
};

export function NumerosWhatsappPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Números de WhatsApp</h1>
        <p className={styles.sub}>Uso, setor vinculado e modo de roteamento de cada número da RC</p>
      </header>

      <div className={styles.aviso}>
        Só o número de <strong>Atendimento ao cliente</strong> passa pelo menu central do chatbot. Os
        números de recebimento de notas/manifesto/odômetro e do cliente Policom têm roteamento próprio,
        por identificação automática do texto ou do número de origem.
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Uso</th>
            <th>Setor vinculado</th>
            <th>Modo de roteamento</th>
          </tr>
        </thead>
        <tbody>
          {NUMEROS_WHATSAPP.map((n) => (
            <tr key={n.id}>
              <td className="mono">{n.numero}</td>
              <td>{n.uso}</td>
              <td>{n.setor}</td>
              <td>
                <span className={`badge ${MODO_CLASS[n.modo]}`}>{n.modo}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
