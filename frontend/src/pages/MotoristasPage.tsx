import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Motorista } from '../types';
import shared from '../styles/SupervisorShared.module.css';

const empty = { nome: '', telefone: '', placa: '', ativo: true };

export function MotoristasPage() {
  const [lista, setLista] = useState<Motorista[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLista(await api<Motorista[]>('/motoristas'));
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        placa: form.placa.trim() || null,
        ativo: form.ativo,
      };
      if (editId) {
        await api(`/motoristas/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/motoristas', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(empty);
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const startEdit = (m: Motorista) => {
    setEditId(m.id);
    setForm({
      nome: m.nome,
      telefone: m.telefone,
      placa: m.placa ?? '',
      ativo: m.ativo,
    });
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Motoristas</h1>
        <p className={shared.sub}>Números autorizados a abrir ocorrência no Operacional</p>
      </header>

      <div className={shared.stack}>
        <form className={shared.panel} onSubmit={(e) => void submit(e)}>
          <h2 className={shared.panelTitle}>
            {editId ? 'Editar motorista' : 'Cadastrar motorista'}
          </h2>
          {error && <div className={shared.error}>{error}</div>}

          <div className={`${shared.formRow} ${shared.formRow3}`}>
            <div className="field">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                required
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="field">
              <label htmlFor="telefone">Telefone (WhatsApp)</label>
              <input
                id="telefone"
                required
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                placeholder="5511987654321"
              />
              <span className="hint">
                Só números, sem espaço, traço, parênteses ou &apos;+&apos;. Formato: DDI + DDD +
                número. Exemplo: <strong>5511987654321</strong> → 55 (Brasil) + 11 (DDD) + 987654321
              </span>
            </div>
            <div className="field">
              <label htmlFor="placa">Placa (opcional)</label>
              <input
                id="placa"
                value={form.placa}
                onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))}
                placeholder="ABC1D23"
              />
            </div>
          </div>

          {editId && (
            <div className="field">
              <label className={shared.check}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                />
                Ativo
              </label>
            </div>
          )}

          <div className={shared.actions}>
            <button type="submit" className="btn btn-ambar">
              {editId ? 'Salvar' : 'Cadastrar motorista'}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditId(null);
                  setForm(empty);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section>
          <h2 className={shared.sectionTitle}>Motoristas cadastrados</h2>
          <div className={shared.tableCard}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Placa</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.nome}</strong>
                    </td>
                    <td className="mono">{m.telefone}</td>
                    <td className="mono">{m.placa ?? '—'}</td>
                    <td>
                      <span className={`badge ${m.ativo ? 'badge-encerrada' : 'badge-sla'}`}>
                        {m.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="link-edit" onClick={() => startEdit(m)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
