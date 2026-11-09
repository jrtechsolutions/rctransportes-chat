import { useState } from 'react';
import { Modal } from '../components/Modal';
import { formatarCnpj, soDigitos } from '../lib/danfe';
import { CHATBOT_FLUXOS, CLIENTES } from '../mock/data';
import type { ClienteMock, MotoristaMock } from '../mock/types';
import styles from './PageShared.module.css';

const FLUXO_CLASS: Record<string, string> = {
  padrao: styles.badgeAzul,
  contrato: styles.badgeVerde,
  policom: styles.badgeAmbar,
};

const nomeFluxo = (id: string) => CHATBOT_FLUXOS.find((f) => f.id === id)?.nome ?? id;

type Form = {
  empresa: string;
  cnpj: string;
  contato: string;
  whatsapp1: string;
  whatsapp2: string;
  chatbot: string;
  status: ClienteMock['status'];
};

const VAZIO: Form = {
  empresa: '',
  cnpj: '',
  contato: '',
  whatsapp1: '',
  whatsapp2: '',
  chatbot: 'padrao',
  status: 'Ativo',
};

export function ClientesTab({ motoristas }: { motoristas: MotoristaMock[] }) {
  const [clientes, setClientes] = useState(CLIENTES);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<ClienteMock | 'novo' | null>(null);

  const termo = busca.trim().toLowerCase();
  const digitos = soDigitos(busca);
  const lista = clientes.filter(
    (c) =>
      !termo ||
      c.empresa.toLowerCase().includes(termo) ||
      c.contato.toLowerCase().includes(termo) ||
      (digitos.length >= 3 &&
        [c.cnpj, c.whatsapp1, c.whatsapp2 ?? ''].some((v) => soDigitos(v).includes(digitos))),
  );

  const salvar = (form: Form) => {
    const dados = {
      empresa: form.empresa.trim(),
      cnpj: soDigitos(form.cnpj),
      contato: form.contato.trim(),
      whatsapp1: form.whatsapp1.trim(),
      whatsapp2: form.whatsapp2.trim() || null,
      chatbot: form.chatbot,
      status: form.status,
    };
    if (editando && editando !== 'novo') {
      setClientes((l) => l.map((c) => (c.id === editando.id ? { ...c, ...dados } : c)));
    } else {
      setClientes((l) => [{ id: `cl${Date.now()}`, ...dados }, ...l]);
    }
    setEditando(null);
  };

  return (
    <>
      <div className={styles.aviso}>
        Quando chega mensagem de um número cadastrado aqui, o sistema já reconhece a empresa e envia o
        chatbot definido para ela. Número que não está na base entra como <strong>Lead novo</strong>.
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filter}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar empresa, CNPJ, contato ou WhatsApp"
            style={{ minWidth: 320 }}
          />
        </div>
        <button type="button" className="btn btn-ambar" onClick={() => setEditando('novo')}>
          Novo cliente
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>CNPJ</th>
            <th>Quem fala pela empresa</th>
            <th>WhatsApp</th>
            <th>Chatbot</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((c) => (
            <tr key={c.id} className={styles.rowClick} onClick={() => setEditando(c)}>
              <td>{c.empresa}</td>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                {formatarCnpj(c.cnpj)}
              </td>
              <td>{c.contato}</td>
              <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                {c.whatsapp1}
                {c.whatsapp2 && <div>{c.whatsapp2}</div>}
              </td>
              <td>
                <span className={`badge ${FLUXO_CLASS[c.chatbot] ?? styles.badgeCinza}`}>
                  {nomeFluxo(c.chatbot)}
                </span>
              </td>
              <td>
                <span
                  className={`${styles.badgeStatus} ${
                    c.status === 'Ativo' ? styles.badgeAtivo : styles.badgeInativo
                  }`}
                >
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr>
              <td colSpan={6} style={{ color: 'var(--mono)', textAlign: 'center' }}>
                Nenhum cliente encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editando && (
        <ClienteModal
          cliente={editando === 'novo' ? null : editando}
          clientes={clientes}
          motoristas={motoristas}
          onClose={() => setEditando(null)}
          onSalvar={salvar}
        />
      )}
    </>
  );
}

function ClienteModal({
  cliente,
  clientes,
  motoristas,
  onClose,
  onSalvar,
}: {
  cliente: ClienteMock | null;
  clientes: ClienteMock[];
  motoristas: MotoristaMock[];
  onClose: () => void;
  onSalvar: (form: Form) => void;
}) {
  const [form, setForm] = useState<Form>(() =>
    cliente
      ? {
          empresa: cliente.empresa,
          cnpj: formatarCnpj(cliente.cnpj),
          contato: cliente.contato,
          whatsapp1: cliente.whatsapp1,
          whatsapp2: cliente.whatsapp2 ?? '',
          chatbot: cliente.chatbot,
          status: cliente.status,
        }
      : VAZIO,
  );
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  /** Um número só pode pertencer a um contato — senão o sistema não sabe qual chatbot mandar */
  const donoDoNumero = (numero: string): string | null => {
    const d = soDigitos(numero);
    if (d.length < 10) return null;
    const outroCliente = clientes.find(
      (c) => c.id !== cliente?.id && [c.whatsapp1, c.whatsapp2 ?? ''].some((n) => soDigitos(n) === d),
    );
    if (outroCliente) return outroCliente.empresa;
    const motorista = motoristas.find((m) => soDigitos(m.telefone) === d);
    return motorista ? `${motorista.nome} (motorista)` : null;
  };

  const cnpjDigitos = soDigitos(form.cnpj);
  const cnpjErro = cnpjDigitos.length > 0 && cnpjDigitos.length !== 14;
  const cnpjDuplicado = clientes.find((c) => c.id !== cliente?.id && c.cnpj === cnpjDigitos && cnpjDigitos);
  const dono1 = donoDoNumero(form.whatsapp1);
  const dono2 = donoDoNumero(form.whatsapp2);
  const mesmoNumero =
    soDigitos(form.whatsapp2).length >= 10 && soDigitos(form.whatsapp1) === soDigitos(form.whatsapp2);

  const valido =
    form.empresa.trim() &&
    cnpjDigitos.length === 14 &&
    !cnpjDuplicado &&
    form.contato.trim() &&
    soDigitos(form.whatsapp1).length >= 10 &&
    !dono1 &&
    !dono2 &&
    !mesmoNumero;

  const fluxo = CHATBOT_FLUXOS.find((f) => f.id === form.chatbot);
  const erro = (texto: string) => (
    <span className="hint" style={{ color: 'var(--erro-d)' }}>
      {texto}
    </span>
  );

  return (
    <Modal title={cliente ? 'Editar cliente' : 'Novo cliente'} onClose={onClose} wide>
      <div className="field">
        <label>Nome da empresa *</label>
        <input value={form.empresa} onChange={(e) => set('empresa', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
        <div className="field">
          <label>CNPJ *</label>
          <input
            className="mono"
            value={form.cnpj}
            onChange={(e) => set('cnpj', e.target.value)}
            onBlur={() => set('cnpj', formatarCnpj(form.cnpj))}
            placeholder="00.000.000/0000-00"
          />
          {cnpjErro && erro('O CNPJ precisa ter 14 dígitos')}
          {cnpjDuplicado && erro(`CNPJ já cadastrado para ${cnpjDuplicado.empresa}`)}
        </div>
        <div className="field">
          <label>Quem fala pela empresa *</label>
          <input
            value={form.contato}
            onChange={(e) => set('contato', e.target.value)}
            placeholder="Ex.: Sandra Ribeiro (expedição)"
          />
        </div>
        <div className="field">
          <label>WhatsApp principal *</label>
          <input
            className="mono"
            value={form.whatsapp1}
            onChange={(e) => set('whatsapp1', e.target.value)}
            placeholder="(19) 99999-0000"
          />
          {dono1 && erro(`Número já cadastrado para ${dono1}`)}
        </div>
        <div className="field">
          <label>Segundo WhatsApp (opcional)</label>
          <input
            className="mono"
            value={form.whatsapp2}
            onChange={(e) => set('whatsapp2', e.target.value)}
            placeholder="(19) 99999-0000"
          />
          {dono2 && erro(`Número já cadastrado para ${dono2}`)}
          {mesmoNumero && erro('Igual ao WhatsApp principal')}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 12 }}>
        <div className="field">
          <label>Chatbot enviado para este cliente</label>
          <select value={form.chatbot} onChange={(e) => set('chatbot', e.target.value)}>
            {CHATBOT_FLUXOS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          {fluxo && <span className="hint">{fluxo.desc}</span>}
        </div>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value as Form['status'])}>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ambar"
        style={{ width: '100%' }}
        disabled={!valido}
        onClick={() => onSalvar(form)}
      >
        {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
      </button>
    </Modal>
  );
}
