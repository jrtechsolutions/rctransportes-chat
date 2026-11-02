import { useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DASHBOARD_KPIS } from '../mock/data';
import styles from './DashboardPage.module.css';

const volumeDia = [
  { dia: 'Seg', qtd: 42 },
  { dia: 'Ter', qtd: 55 },
  { dia: 'Qua', qtd: 48 },
  { dia: 'Qui', qtd: 61 },
  { dia: 'Sex', qtd: 70 },
  { dia: 'Sáb', qtd: 28 },
  { dia: 'Dom', qtd: 12 },
];

const porMotivo = [
  { nome: 'Rastreamento', qtd: 220 },
  { nome: 'Entrega', qtd: 180 },
  { nome: 'Coleta', qtd: 150 },
  { nome: 'Reclamações', qtd: 95 },
  { nome: 'Comercial', qtd: 80 },
  { nome: 'Documentação', qtd: 72 },
];

const slaSetor = [
  { setor: 'Operacional', min: 3.8 },
  { setor: 'Comercial', min: 9.2 },
  { setor: 'Financeiro', min: 6.5 },
];

const tipoContato = [
  { nome: 'Cliente', value: 48 },
  { nome: 'Motorista', value: 28 },
  { nome: 'Agregado', value: 14 },
  { nome: 'Lead novo', value: 10 },
];

const ocorrPrioridade = [
  { nome: 'Crítica', qtd: 3 },
  { nome: 'Alta', qtd: 8 },
  { nome: 'Média', qtd: 12 },
  { nome: 'Baixa', qtd: 5 },
];

const topClientes = [
  { nome: 'Distribuidora ABC', qtd: 86 },
  { nome: 'Metalúrgica Campinas', qtd: 72 },
  { nome: 'Alimentos Vale Verde', qtd: 58 },
  { nome: 'Plásticos Sumaré', qtd: 44 },
  { nome: 'Farmacêutica BioLife', qtd: 39 },
];

const topMotoristas = [
  { nome: 'José da Silva', qtd: 12 },
  { nome: 'Ricardo Ferreira', qtd: 9 },
  { nome: 'Marcos Oliveira', qtd: 7 },
  { nome: 'Paulo Henrique', qtd: 5 },
  { nome: 'Antônio Carlos', qtd: 3 },
];

const reclamacoesMes = [
  { mes: 'Mai', qtd: 18 },
  { mes: 'Jun', qtd: 22 },
  { mes: 'Jul', qtd: 15 },
  { mes: 'Ago', qtd: 27 },
  { mes: 'Set', qtd: 20 },
  { mes: 'Out', qtd: 14 },
];

const produtividade = [
  { agente: 'Carlos', qtd: 142 },
  { agente: 'Ana', qtd: 128 },
  { agente: 'Roberto', qtd: 110 },
  { agente: 'Juliana', qtd: 95 },
  { agente: 'Mariana', qtd: 88 },
];

const comparativo = [
  { metrica: 'Atend.', atual: 1284, anterior: 1150 },
  { metrica: 'Ocorr.', atual: 48, anterior: 52 },
  { metrica: 'Leads', atual: 41, anterior: 33 },
  { metrica: 'Reclam.', atual: 27, anterior: 31 },
];

const CORES = ['#2D6CA6', '#1F6B47', '#D98A2B', '#5B615D', '#1F4E7A'];

export function DashboardPage() {
  const [maisFiltros, setMaisFiltros] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard gerencial</h1>
        <p className={styles.sub}>Visão consolidada · dados fictícios para apresentação</p>
      </header>

      <div className={styles.filters}>
        <select defaultValue="30d">
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
        </select>
        <select defaultValue="">
          <option value="">Setor</option>
          <option>Operacional</option>
          <option>Comercial</option>
          <option>Financeiro</option>
        </select>
        <select defaultValue="">
          <option value="">Agente</option>
          <option>Carlos Mendes</option>
          <option>Ana Paula Souza</option>
        </select>
        <select defaultValue="">
          <option value="">Tipo de contato</option>
          <option>Cliente</option>
          <option>Motorista</option>
          <option>Agregado</option>
          <option>Lead novo</option>
        </select>
        <select defaultValue="">
          <option value="">Status</option>
          <option>Aberto</option>
          <option>Resolvido</option>
        </select>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMaisFiltros((v) => !v)}>
          {maisFiltros ? '− Menos filtros' : '+ Mais filtros'}
        </button>
      </div>

      {maisFiltros && (
        <div className={styles.filters}>
          <select defaultValue="">
            <option value="">Cliente</option>
            <option>Distribuidora ABC Ltda</option>
          </select>
          <select defaultValue="">
            <option value="">Motorista</option>
            <option>José da Silva</option>
          </select>
          <select defaultValue="">
            <option value="">Motivo</option>
            <option>Rastreamento</option>
          </select>
          <select defaultValue="">
            <option value="">Resultado</option>
            <option>Resolvido na conversa</option>
          </select>
          <select defaultValue="">
            <option value="">Prioridade</option>
            <option>Crítica</option>
            <option>Alta</option>
          </select>
        </div>
      )}

      <div className={styles.kpiGrid}>
        {DASHBOARD_KPIS.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiValor}>
              {k.valor}
              {k.alerta && <span className={`badge badge-sla ${styles.kpiBadge}`}>{k.alerta}</span>}
            </div>
            <div className={styles.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.charts}>
        <ChartCard title="Volume de atendimentos por dia">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volumeDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="qtd" stroke="#2D6CA6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por motivo">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porMotivo} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#2D6CA6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SLA médio por setor (min)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={slaSetor}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="setor" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="min" fill="#1F6B47" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Atendimentos por tipo de contato">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tipoContato} dataKey="value" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label>
                {tipoContato.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ocorrências por prioridade">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ocorrPrioridade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#D98A2B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 clientes por volume">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topClientes} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#1F4E7A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 motoristas por ocorrências">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topMotoristas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#5B615D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reclamações por mês">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={reclamacoesMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="qtd" stroke="#D98A2B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtividade por agente">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={produtividade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="agente" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#2D6CA6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Comparativo mês atual vs anterior">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparativo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCDFDA" />
              <XAxis dataKey="metrica" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="atual" name="Atual" fill="#2D6CA6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="anterior" name="Anterior" fill="#A8B8C8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className={styles.rankings}>
        <div className={styles.rankCard}>
          <h2>Top clientes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.map((c, i) => (
                <tr key={c.nome}>
                  <td className="mono">{i + 1}</td>
                  <td>{c.nome}</td>
                  <td className="mono">{c.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.rankCard}>
          <h2>Top motoristas</h2>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Motorista</th>
                <th>Ocorrências</th>
              </tr>
            </thead>
            <tbody>
              {topMotoristas.map((m, i) => (
                <tr key={m.nome}>
                  <td className="mono">{i + 1}</td>
                  <td>{m.nome}</td>
                  <td className="mono">{m.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.chartCard}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
