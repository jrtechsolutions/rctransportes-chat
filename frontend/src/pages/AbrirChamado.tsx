import { useState, type FormEvent } from 'react';
import styles from './AbrirChamado.module.css';

const VEICULOS = ['Toco', 'Truck', 'Bitrem', 'Carreta', 'VUC', 'HR'] as const;

type UnidadePeso = 'kg' | 't';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Formata Date → valor de input datetime-local (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function atalhoHoje14(): string {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  return toDatetimeLocal(d);
}

function atalhoAmanha8(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return toDatetimeLocal(d);
}

function atalhoEm2h(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return toDatetimeLocal(d);
}

function formatarCorte(isoLocal: string): string {
  if (!isoLocal) return '';
  const d = new Date(isoLocal);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AbrirChamado() {
  const [cliente, setCliente] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [peso, setPeso] = useState('');
  const [unidade, setUnidade] = useState<UnidadePeso>('kg');
  const [horarioCorte, setHorarioCorte] = useState('');
  const [emailOriginal, setEmailOriginal] = useState('');
  const [criando, setCriando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const pesoNum = Number(String(peso).replace(',', '.'));
  const podeCriar =
    cliente.trim().length > 0 &&
    tipoVeiculo.length > 0 &&
    peso.trim().length > 0 &&
    !Number.isNaN(pesoNum) &&
    pesoNum > 0 &&
    horarioCorte.length > 0;

  const criar = (e: FormEvent) => {
    e.preventDefault();
    if (!podeCriar) return;
    setCriando(true);
    window.setTimeout(() => {
      const pesoLabel = `${peso.replace('.', ',')} ${unidade === 't' ? 't' : 'kg'}`;
      setSucesso(
        `Chamado de ${cliente.trim()} criado — ${tipoVeiculo}, ${pesoLabel}, corte ${formatarCorte(horarioCorte)}. Já está no painel da expedição (mock).`,
      );
      setCliente('');
      setTipoVeiculo('');
      setPeso('');
      setUnidade('kg');
      setHorarioCorte('');
      setEmailOriginal('');
      setCriando(false);
    }, 350);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Abrir chamado</h1>
        <div className={styles.sub}>Preencha os dados da carga para enviar à expedição</div>
      </header>

      {sucesso && (
        <div className={styles.alertas}>
          <div className={styles.sucesso}>{sucesso}</div>
        </div>
      )}

      <div className={styles.body}>
        <form className={styles.card} onSubmit={criar}>
          <div className={styles.fields}>
            <div>
              <label className={styles.label} htmlFor="ch-cliente">
                Cliente *
              </label>
              <input
                id="ch-cliente"
                className={styles.input}
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nome do cliente"
                maxLength={200}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-veiculo">
                Tipo de veículo *
              </label>
              <select
                id="ch-veiculo"
                className={styles.input}
                value={tipoVeiculo}
                onChange={(e) => setTipoVeiculo(e.target.value)}
              >
                <option value="">Selecione…</option>
                {VEICULOS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-peso">
                Peso *
              </label>
              <div className={styles.pesoRow}>
                <input
                  id="ch-peso"
                  className={`${styles.input} ${styles.pesoInput}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="0"
                />
                <div className={styles.unidadeToggle} role="group" aria-label="Unidade de peso">
                  <button
                    type="button"
                    className={unidade === 'kg' ? styles.unidadeAtiva : styles.unidadeBtn}
                    onClick={() => setUnidade('kg')}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={unidade === 't' ? styles.unidadeAtiva : styles.unidadeBtn}
                    onClick={() => setUnidade('t')}
                  >
                    toneladas
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={styles.label} htmlFor="ch-corte">
                Horário de corte *
              </label>
              <div className={styles.atalhos}>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoHoje14())}
                >
                  Hoje 14h
                </button>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoAmanha8())}
                >
                  Amanhã 8h
                </button>
                <button
                  type="button"
                  className={styles.atalho}
                  onClick={() => setHorarioCorte(atalhoEm2h())}
                >
                  Em 2h
                </button>
              </div>
              <input
                id="ch-corte"
                className={`${styles.input} ${styles.mono}`}
                type="datetime-local"
                value={horarioCorte}
                onChange={(e) => setHorarioCorte(e.target.value)}
              />
            </div>

            <div className={styles.emailBox}>
              <label className={styles.label} htmlFor="ch-email-ref">
                E-mail original <span className={styles.opcional}>(opcional)</span>
              </label>
              <p className={styles.emailHint}>
                Cole aqui o e-mail original, se quiser manter como referência. Fica guardado junto do
                chamado — sem análise automática.
              </p>
              <textarea
                id="ch-email-ref"
                className={styles.textarea}
                value={emailOriginal}
                onChange={(e) => setEmailOriginal(e.target.value)}
                placeholder="Cole aqui o e-mail original, se quiser manter como referência"
                rows={5}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-ambar ${styles.fullBtn} ${styles.criarBtn}`}
            disabled={!podeCriar || criando}
          >
            {criando ? 'Criando…' : 'Criar chamado'}
          </button>
        </form>
      </div>
    </div>
  );
}
