import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AUDITORIA } from '../mock/data';
import styles from './PageShared.module.css';

/** "dd/mm/aaaa hh:mm" → "aaaa-mm-dd" para comparar com o input de data */
function isoDia(dataHora: string) {
  const [d, m, a] = dataHora.split(' ')[0].split('/');
  return `${a}-${m}-${d}`;
}

export function AuditoriaPage() {
  const [usuario, setUsuario] = useState('todos');
  const [de, setDe] = useState('2026-10-01');
  const [ate, setAte] = useState('2026-10-31');

  const usuarios = [...new Set(AUDITORIA.map((a) => a.usuario))];

  const lista = AUDITORIA.filter((a) => {
    if (usuario !== 'todos' && a.usuario !== usuario) return false;
    const dia = isoDia(a.dataHora);
    if (de && dia < de) return false;
    if (ate && dia > ate) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Log de auditoria</h1>
        <p className={styles.sub}>
          Quem alterou o quê em atendimentos, ocorrências, pendências, usuários e setores · visível só
          para Administrador
        </p>
      </header>

      <div className={styles.filters}>
        <div className={styles.filter}>
          <label>Usuário</label>
          <select value={usuario} onChange={(e) => setUsuario(e.target.value)}>
            <option value="todos">Todos</option>
            {usuarios.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className={styles.filter}>
          <label>De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className={styles.filter}>
          <label>Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Data/hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Registro afetado</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((a) => (
            <tr key={a.id}>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>{a.dataHora}</td>
              <td>{a.usuario}</td>
              <td>{a.acao}</td>
              <td>
                {a.registro}
                <Link to={a.rota} className={`link-edit ${styles.linkAbrir}`}>
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: 'var(--mono)', textAlign: 'center' }}>
                Nenhum registro no período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
