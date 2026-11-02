import { useState } from 'react';
import { Modal } from '../components/Modal';
import { ALL_TELA_IDS, MOTORISTAS, SETORES, TELA_LABEL, TODAS_TELAS, USUARIOS } from '../mock/data';
import type { MotoristaMock, TelaId, UsuarioMock } from '../mock/types';
import styles from './PageShared.module.css';
import userStyles from './UsuariosPage.module.css';

export function UsuariosPage() {
  const [aba, setAba] = useState<'usuarios' | 'motoristas'>('usuarios');
  const [usuarios, setUsuarios] = useState(USUARIOS);
  const [motoristas, setMotoristas] = useState(MOTORISTAS);
  const [showUser, setShowUser] = useState(false);
  const [showMot, setShowMot] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [setor, setSetor] = useState('Operacional');
  const [admin, setAdmin] = useState(false);
  const [telas, setTelas] = useState<TelaId[]>(['conversas']);

  const [motNome, setMotNome] = useState('');
  const [motTel, setMotTel] = useState('');
  const [motTipo, setMotTipo] = useState<'Funcionario' | 'Agregado'>('Funcionario');
  const [motPlaca, setMotPlaca] = useState('');

  const toggleTela = (id: TelaId) => {
    if (admin) return;
    setTelas((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const onAdminToggle = (checked: boolean) => {
    setAdmin(checked);
    if (checked) setTelas([...ALL_TELA_IDS]);
  };

  const criarUsuario = () => {
    if (!nome.trim() || !email.trim()) return;
    const novo: UsuarioMock = {
      id: `u${Date.now()}`,
      nome: nome.trim(),
      email: email.trim(),
      setor,
      admin,
      telas: admin ? [...ALL_TELA_IDS] : telas,
      status: 'Ativo',
    };
    setUsuarios((list) => [novo, ...list]);
    setShowUser(false);
    setNome('');
    setEmail('');
    setAdmin(false);
    setTelas(['conversas']);
    setSetor('Operacional');
  };

  const criarMotorista = () => {
    if (!motNome.trim() || !motTel.trim()) return;
    const novo: MotoristaMock = {
      id: `mo${Date.now()}`,
      nome: motNome.trim(),
      telefone: motTel.trim(),
      tipo: motTipo,
      placa: motPlaca.trim() || null,
      status: 'Ativo',
    };
    setMotoristas((list) => [novo, ...list]);
    setShowMot(false);
    setMotNome('');
    setMotTel('');
    setMotPlaca('');
  };

  const telasExibidas = (u: UsuarioMock) => (u.admin ? ALL_TELA_IDS : u.telas);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Usuários</h1>
        <p className={styles.sub}>
          Cada usuário tem um setor e telas liberadas por checkbox — Administrador vê tudo
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={aba === 'usuarios' ? styles.tabActive : styles.tab}
          onClick={() => setAba('usuarios')}
        >
          Usuários do sistema
        </button>
        <button
          type="button"
          className={aba === 'motoristas' ? styles.tabActive : styles.tab}
          onClick={() => setAba('motoristas')}
        >
          Motoristas e Agregados
        </button>
      </div>

      {aba === 'usuarios' && (
        <>
          <div className={styles.toolbar}>
            <span />
            <button type="button" className="btn btn-ambar" onClick={() => setShowUser(true)}>
              Novo usuário
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail corporativo</th>
                <th>Setor</th>
                <th>Telas liberadas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.nome}
                    {u.admin && <span className={userStyles.adminTag}>Admin</span>}
                  </td>
                  <td className="mono">{u.email}</td>
                  <td>{u.setor}</td>
                  <td>
                    <div className={userStyles.telas}>
                      {telasExibidas(u).map((t) => (
                        <span key={t} className={userStyles.telaBadge}>
                          {TELA_LABEL[t]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badgeStatus} ${
                        u.status === 'Ativo' ? styles.badgeAtivo : styles.badgeInativo
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {aba === 'motoristas' && (
        <>
          <div className={styles.toolbar}>
            <span />
            <button type="button" className="btn btn-ambar" onClick={() => setShowMot(true)}>
              Novo motorista/agregado
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {motoristas.map((m) => (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td className="mono">{m.telefone}</td>
                  <td>{m.tipo === 'Funcionario' ? 'Funcionário' : 'Agregado'}</td>
                  <td className="mono">{m.placa ?? '—'}</td>
                  <td>
                    <span
                      className={`${styles.badgeStatus} ${
                        m.status === 'Ativo' ? styles.badgeAtivo : styles.badgeInativo
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showUser && (
        <Modal title="Novo usuário" onClose={() => setShowUser(false)} wide>
          <div className="field">
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label>E-mail corporativo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Setor</label>
            <select value={setor} onChange={(e) => setSetor(e.target.value)}>
              {SETORES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="hint">Define a fila de mensagens — independente das telas liberadas</span>
          </div>

          <label className={userStyles.adminToggle}>
            <input type="checkbox" checked={admin} onChange={(e) => onAdminToggle(e.target.checked)} />
            <span>
              <strong>Administrador</strong>
              <span className={userStyles.adminHint}> — vê todas as telas automaticamente</span>
            </span>
          </label>

          <div className={userStyles.checkGrid}>
            <div className={userStyles.checkTitle}>Telas liberadas</div>
            {TODAS_TELAS.map((t) => (
              <label
                key={t.id}
                className={admin ? `${userStyles.checkItem} ${userStyles.checkDisabled}` : userStyles.checkItem}
              >
                <input
                  type="checkbox"
                  checked={admin || telas.includes(t.id)}
                  disabled={admin}
                  onChange={() => toggleTela(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ambar"
            style={{ width: '100%', marginTop: 16 }}
            disabled={!nome.trim() || !email.trim() || (!admin && telas.length === 0)}
            onClick={criarUsuario}
          >
            Criar usuário
          </button>
        </Modal>
      )}

      {showMot && (
        <Modal title="Novo motorista / agregado" onClose={() => setShowMot(false)}>
          <div className="field">
            <label>Nome</label>
            <input value={motNome} onChange={(e) => setMotNome(e.target.value)} />
          </div>
          <div className="field">
            <label>Telefone</label>
            <input value={motTel} onChange={(e) => setMotTel(e.target.value)} />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select
              value={motTipo}
              onChange={(e) => setMotTipo(e.target.value as 'Funcionario' | 'Agregado')}
            >
              <option value="Funcionario">Funcionário</option>
              <option value="Agregado">Agregado</option>
            </select>
          </div>
          <div className="field">
            <label>Placa (opcional)</label>
            <input className="mono" value={motPlaca} onChange={(e) => setMotPlaca(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-ambar"
            style={{ width: '100%' }}
            disabled={!motNome.trim() || !motTel.trim()}
            onClick={criarMotorista}
          >
            Cadastrar
          </button>
        </Modal>
      )}
    </div>
  );
}
