export type TelaId =
  | 'conversas'
  | 'config-setor'
  | 'ocorrencias'
  | 'pendencias'
  | 'km'
  | 'abrir-chamado'
  | 'trabalhar-chamado'
  | 'dashboard'
  | 'relatorios'
  | 'usuarios'
  | 'numeros-whatsapp'
  | 'falhas-integracao'
  | 'auditoria';

export type TipoContato = 'Motorista' | 'Agregado' | 'Cliente' | 'Lead novo';

export type Conversa = {
  id: string;
  nome: string;
  tipo: TipoContato;
  telefone: string;
  setor: string;
  agente: string | null;
  ultimaMensagem: string;
  tempo: string;
  sla: 'critico' | 'ok' | null;
  slaLabel?: string;
  minha: boolean;
  mensagens: MensagemMock[];
};

export type MensagemMock = {
  id: string;
  de: 'cliente' | 'agente';
  texto: string;
  hora: string;
};

export type Ocorrencia = {
  id: string;
  protocolo: string;
  contato: string;
  motivo: string;
  prioridade: 'Critica' | 'Alta' | 'Media' | 'Baixa';
  responsavel: string;
  prazo: string;
  status: 'Aberta' | 'Em andamento' | 'Resolvida' | 'Reaberta';
  historico: { texto: string; quando: string }[];
};

export type Pendencia = {
  id: string;
  protocolo: string;
  /** Pendência pode nascer de uma ocorrência, de um atendimento ou ser avulsa */
  origemTipo: 'Ocorrência' | 'Atendimento' | null;
  /** Protocolo da ocorrência ou nome do contato do atendimento */
  origemRef: string | null;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: 'Aberta' | 'Vencida' | 'Concluída';
  prioridade: Ocorrencia['prioridade'];
};

export type FalhaIntegracao = {
  id: string;
  dataHora: string;
  numeroOrigem: string;
  tipo: 'Mensagem não entregue' | 'Webhook não processado' | 'Timeout da API';
  conteudo: string;
  status: 'Pendente de revisão' | 'Reprocessado' | 'Ignorado';
};

export type AuditoriaRegistro = {
  id: string;
  dataHora: string;
  usuario: string;
  acao: string;
  registro: string;
  rota: string;
};

export type KmRegistro = {
  id: string;
  motorista: string;
  data: string;
  kmInicial: number;
  kmFinal: number | null;
  status: 'ok' | 'pendente';
};

export type UsuarioMock = {
  id: string;
  nome: string;
  email: string;
  setor: string;
  admin: boolean;
  telas: TelaId[];
  status: 'Ativo' | 'Inativo';
  /** Aparece no seletor "Visualizar como" da sidebar */
  visualizarComo?: boolean;
  /** Rótulo curto no seletor, ex.: "Carlos (atendente de conversas)" */
  labelSeletor?: string;
};

export type MotoristaMock = {
  id: string;
  nome: string;
  telefone: string;
  tipo: 'Funcionario' | 'Agregado';
  placa: string | null;
  status: 'Ativo' | 'Inativo';
};

export type AgenteSetor = {
  id: string;
  nome: string;
  limite: number;
};

export type ChamadoMock = {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  destino: string;
  notaFiscal: string | null;
  tipoVeiculo: string;
  peso: string;
  horarioLimite: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  criadoPorId: string;
  assumidoPorId: string | null;
  resolvidoEm: string | null;
  emailConfirmacaoEnviadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: { id: string; nome: string; email?: string };
  assumidoPor: { id: string; nome: string } | null;
  emailOriginalTexto: string;
  observacoes: {
    id: string;
    chamadoId: string;
    autorId: string;
    texto: string;
    criadoEm: string;
    autor: { id: string; nome: string };
  }[];
};
