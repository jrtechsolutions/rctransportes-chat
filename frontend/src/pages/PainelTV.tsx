import { useEffect, useMemo, useRef, useState } from 'react';
import { minutosDesde, primeiroNome, resumoCarga, tempoDesde } from '../lib/chamados';
import { CHAMADOS_MOCK } from '../mock/data';
import type { ChamadoMock } from '../mock/types';
import logoBranco from '../assets/rc-logo-branco.png';
import styles from './PainelTV.module.css';

const TICK_MS = 15_000;
const DESTAQUE_MIN = 3;
const PISCA_MS = 60_000;
const POR_PAGINA = 16;
const ROTACAO_MS = 15_000;

function tocarAlerta(ctx: AudioContext) {
  if (ctx.state === 'suspended') void ctx.resume();
  const inicio = ctx.currentTime + 0.05;
  const notas = [880, 1175, 1568, 880, 1175, 1568];
  notas.forEach((freq, i) => {
    const t = inicio + i * 0.22 + (i >= 3 ? 0.35 : 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}

function ordenar(lista: ChamadoMock[]): ChamadoMock[] {
  const peso = (c: ChamadoMock) => (c.status === 'ABERTO' ? 0 : 1);
  return [...lista].sort(
    (a, b) => peso(a) - peso(b) || new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );
}

function PainelAtivo({ audio }: { audio: AudioContext }) {
  const [agora, setAgora] = useState(Date.now());
  const [pagina, setPagina] = useState(0);
  const chegadas = useRef<Map<string, number>>(new Map());
  const alertou = useRef(false);

  const chamados = useMemo(() => {
    // Recalcula idades no mount do painel para o destaque âmbar (< 3 min) funcionar na demo.
    const now = Date.now();
    const frescos = CHAMADOS_MOCK.map((c) => {
      if (c.id === 'ch3' && c.status === 'ABERTO') {
        return { ...c, criadoEm: new Date(now - 60_000).toISOString(), atualizadoEm: new Date(now - 60_000).toISOString() };
      }
      return c;
    });
    return ordenar(frescos.filter((c) => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO'));
  }, []);

  useEffect(() => {
    // Alerta sonoro + pisca só para abertos recentes (< 3 min) — não marca os antigos como "novos".
    const novos = chamados.filter(
      (c) => c.status === 'ABERTO' && minutosDesde(c.criadoEm) < DESTAQUE_MIN,
    );
    if (!alertou.current && novos.length > 0) {
      tocarAlerta(audio);
      const t = Date.now();
      for (const c of novos) chegadas.current.set(c.id, t);
      alertou.current = true;
      setAgora(t);
    }
  }, [audio, chamados]);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(chamados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);

  useEffect(() => {
    if (totalPaginas <= 1) return;
    const t = setInterval(() => setPagina((p) => (p + 1) % totalPaginas), ROTACAO_MS);
    return () => clearInterval(t);
  }, [totalPaginas]);

  const visiveis = chamados.slice(paginaAtual * POR_PAGINA, (paginaAtual + 1) * POR_PAGINA);
  const relogio = new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const cardInfo = (c: ChamadoMock) => {
    // Destaque âmbar = aberto criado há menos de ~3 min (todos nesse intervalo, não só um).
    const recente = c.status === 'ABERTO' && minutosDesde(c.criadoEm, agora) < DESTAQUE_MIN;
    const chegou = chegadas.current.get(c.id);
    const pisca = recente && chegou != null && agora - chegou < PISCA_MS;
    return { recente, pisca };
  };

  return (
    <div className={styles.painel}>
      <header className={styles.topo}>
        <div className={styles.marca}>
          <img src={logoBranco} alt="RC Transportes" className={styles.logo} />
          <h1 className={styles.titulo}>Painel da expedição</h1>
        </div>
        <div className={styles.relogio}>{relogio}</div>
      </header>

      {chamados.length === 0 ? (
        <div className={styles.vazio}>Nenhum chamado pendente</div>
      ) : (
        <div className={styles.grid}>
          {visiveis.map((c) => {
            const { recente, pisca } = cardInfo(c);
            const cls = [
              styles.card,
              recente ? styles.cardNovo : '',
              pisca ? styles.pisca : '',
              c.status === 'EM_ANDAMENTO' ? styles.cardAndamento : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={c.id} className={cls}>
                <div>
                  <div className={styles.cardLabel}>
                    {c.status === 'EM_ANDAMENTO'
                      ? `Em andamento · ${primeiroNome(c.assumidoPor?.nome)}`
                      : recente
                        ? `Novo · ${tempoDesde(c.criadoEm, agora)}`
                        : `Aberto ${tempoDesde(c.criadoEm, agora)}`}
                  </div>
                  <div className={styles.cardNome}>{c.clienteNome}</div>
                </div>
                <div className={styles.cardResumo}>{resumoCarga(c)}</div>
                <div className={styles.cardLimite}>Limite: {c.horarioLimite}</div>
              </div>
            );
          })}
        </div>
      )}

      <footer className={styles.rodape}>
        {totalPaginas > 1
          ? `Página ${paginaAtual + 1} de ${totalPaginas} · ${chamados.length} chamados`
          : `${chamados.length} ${chamados.length === 1 ? 'chamado pendente' : 'chamados pendentes'}`}
      </footer>
    </div>
  );
}

export function PainelTV() {
  const [audio, setAudio] = useState<AudioContext | null>(null);

  const iniciar = async () => {
    const ctx = new AudioContext();
    await ctx.resume().catch(() => undefined);
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
    setAudio(ctx);
  };

  if (!audio) {
    return (
      <button type="button" className={styles.splash} onClick={() => void iniciar()}>
        <img src={logoBranco} alt="RC Transportes" className={styles.splashLogo} />
        <span className={styles.splashTitulo}>Toque para iniciar o painel</span>
        <span className={styles.splashSub}>Necessário uma vez por turno para liberar o som de alerta</span>
      </button>
    );
  }

  return <PainelAtivo audio={audio} />;
}
