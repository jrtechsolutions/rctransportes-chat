import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useSetoresFromDb } from '../hooks/useSetoresFromDb';
import type { NumeroWhatsapp, Setor } from '../types';
import shared from '../styles/SupervisorShared.module.css';

const emptySetor = { nome: '', numeroWhatsappId: '' };

export function SetoresPage() {
  const { setores: lista, reload } = useSetoresFromDb();
  const [numeros, setNumeros] = useState<NumeroWhatsapp[]>([]);
  const [form, setForm] = useState(emptySetor);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNumeroId, setEditNumeroId] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [numeroError, setNumeroError] = useState<string | null>(null);

  const loadNumeros = useCallback(async () => {
    setNumeros(await api<NumeroWhatsapp[]>('/numeros-whatsapp'));
  }, []);

  useEffect(() => {
    void loadNumeros();
  }, [loadNumeros]);

  useEffect(() => {
    if (!form.numeroWhatsappId && numeros.length > 0) {
      const clientes = numeros.find((n) => n.uso === 'clientes');
      setForm((f) => ({ ...f, numeroWhatsappId: clientes?.id ?? numeros[0].id }));
    }
  }, [numeros, form.numeroWhatsappId]);

  const submitSetor = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        nome: form.nome.trim(),
        numeroWhatsappId: form.numeroWhatsappId,
      };
      if (editId) {
        await api(`/setores/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/setores', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm({
        nome: '',
        numeroWhatsappId: numeros.find((n) => n.uso === 'clientes')?.id ?? '',
      });
      setEditId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const startEditSetor = (s: Setor) => {
    setEditId(s.id);
    setForm({
      nome: s.nome,
      numeroWhatsappId: s.numeroWhatsappId ?? s.numeroWhatsapp?.id ?? '',
    });
  };

  const startEditNumero = (n: NumeroWhatsapp) => {
    setEditNumeroId(n.id);
    setPhoneDraft(n.phoneNumberId);
    setNumeroError(null);
  };

  const saveNumero = async (e: FormEvent) => {
    e.preventDefault();
    if (!editNumeroId) return;
    setNumeroError(null);
    try {
      await api(`/numeros-whatsapp/${editNumeroId}`, {
        method: 'PUT',
        body: JSON.stringify({ phoneNumberId: phoneDraft.trim() }),
      });
      setEditNumeroId(null);
      setPhoneDraft('');
      await loadNumeros();
      await reload();
    } catch (err) {
      setNumeroError(err instanceof Error ? err.message : 'Erro ao salvar número');
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Setores</h1>
        <p className={shared.sub}>
          Dois números de WhatsApp reais e os setores que apontam para eles
        </p>
      </header>

      <div className={shared.stack}>
        <section>
          <h2 className={shared.sectionTitle}>Números de WhatsApp</h2>
          <div className={shared.tableCard}>
            <table className="table">
              <thead>
                <tr>
                  <th>Uso</th>
                  <th>phone_number_id (Meta)</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {numeros.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <strong>{n.label}</strong>
                      {n.descricao && (
                        <>
                          <br />
                          <span className="hint">{n.descricao}</span>
                        </>
                      )}
                    </td>
                    <td className="mono">{n.phoneNumberId || '—'}</td>
                    <td>
                      <button type="button" className="link-edit" onClick={() => startEditNumero(n)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {numeros.length === 0 && (
                  <tr>
                    <td colSpan={3}>Carregando números…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editNumeroId && (
            <form className={shared.panel} style={{ marginTop: 12 }} onSubmit={(e) => void saveNumero(e)}>
              <h2 className={shared.panelTitle}>
                Editar {numeros.find((n) => n.id === editNumeroId)?.label ?? 'número'}
              </h2>
              {numeroError && <div className={shared.error}>{numeroError}</div>}
              <div className="field">
                <label htmlFor="phoneId">phone_number_id (Meta)</label>
                <input
                  id="phoneId"
                  required
                  className="mono"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="ID do número na Cloud API"
                />
              </div>
              <div className={shared.actions}>
                <button type="submit" className="btn btn-ambar">
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditNumeroId(null);
                    setPhoneDraft('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className={shared.notice}>
            Só existem estes dois números. Comercial e Financeiro sempre apontam para Clientes — quem
            decide a fila entre eles é o menu do chatbot, não o número.
          </div>
        </section>

        <section>
          <form className={shared.panel} onSubmit={(e) => void submitSetor(e)}>
            <h2 className={shared.panelTitle}>{editId ? 'Editar setor' : 'Cadastrar setor'}</h2>
            {error && <div className={shared.error}>{error}</div>}
            <div className={`${shared.formRow} ${shared.formRow2}`}>
              <div className="field">
                <label htmlFor="nome">Nome do setor</label>
                <input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Comercial"
                />
              </div>
              <div className="field">
                <label htmlFor="numero">Número de WhatsApp</label>
                <select
                  id="numero"
                  required
                  value={form.numeroWhatsappId}
                  onChange={(e) => setForm((f) => ({ ...f, numeroWhatsappId: e.target.value }))}
                >
                  {numeros.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                      {n.phoneNumberId ? ` (${n.phoneNumberId})` : ''}
                    </option>
                  ))}
                </select>
                <span className="hint">
                  Escolha da lista acima — não é possível digitar um ID novo aqui.
                </span>
              </div>
            </div>
            <div className={shared.actions}>
              <button type="submit" className="btn btn-ambar" disabled={numeros.length === 0}>
                {editId ? 'Salvar' : 'Cadastrar setor'}
              </button>
              {editId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditId(null);
                    setForm({
                      nome: '',
                      numeroWhatsappId: numeros.find((n) => n.uso === 'clientes')?.id ?? '',
                    });
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <h2 className={shared.sectionTitle}>Setores cadastrados</h2>
          <div className={shared.tableCard}>
            <table className="table">
              <thead>
                <tr>
                  <th>Setor</th>
                  <th>Número</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.nome}</strong>
                    </td>
                    <td>{s.numeroWhatsapp?.label ?? '—'}</td>
                    <td>
                      <button type="button" className="link-edit" onClick={() => startEditSetor(s)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={3}>Nenhum setor cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
