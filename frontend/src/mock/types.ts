export type TelaId =
  | 'conversas'
  | 'config-setor'
  | 'ocorrencias'
  | 'pendencias'
  | 'km'
  | 'notas-coleta'
  | 'abrir-chamado'
  | 'trabalhar-chamado'
  | 'dashboard'
  | 'relatorios'
  | 'usuarios'
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

export type NotaColeta = {
  id: string;
  recebidaEm: string;
  remetente: string;
  tipoRemetente: 'Motorista' | 'Agregado' | 'Ajudante';
  telefone: string;
  emitente: string;
  cnpj: string;
  numero: string;
  serie: string;
  chave: string;
  /** Como a chave foi obtida: código de barras da DANFE ou leitura do texto pela IA */
  leitura: 'Código de barras' | 'IA (texto impresso)';
  /** Preenchido quando alguém do escritório revisou e confirmou os dados */
  confirmadaPor: string | null;
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
  /** Só no protótipo: o número que de fato aparece na foto, quando o sistema leu diferente */
  fotoMock?: { inicial?: number; final?: number };
  /** Preenchido quando alguém corrigiu manualmente o número lido da foto */
  correcao?: {
    por: string;
    quando: string;
    motivo: string;
    lidoInicial: number;
    lidoFinal: number | null;
  };
};

export type UnidadeExpedicao = 'Matriz' | 'Filial';

export const UNIDADES_EXPEDICAO: UnidadeExpedicao[] = ['Matriz', 'Filial'];

export type UsuarioMock = {
  id: string;
  nome: string;
  email: string;
  setor: string;
  admin: boolean;
  telas: TelaId[];
  /** Em quais unidades a pessoa trabalha chamados de expedição (só vale com a tela "Trabalhar chamado") */
  unidadesChamado?: UnidadeExpedicao[];
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
  tipo: 'Motorista' | 'Agregado' | 'Ajudante';
  placa: string | null;
  status: 'Ativo' | 'Inativo';
};

export type ClienteMock = {
  id: string;
  empresa: string;
  cnpj: string;
  /** Pessoa que fala pela empresa no WhatsApp */
  contato: string;
  whatsapp1: string;
  whatsapp2: string | null;
  /** Fluxo de chatbot enviado quando a mensagem vem de um dos números do cliente */
  chatbot: string;
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
  /** Unidade de expedição para onde o chamado foi aberto */
  unidade: UnidadeExpedicao;
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
  observacoes: ObservacaoChamado[];
  /** Quem abriu adicionou complemento que a expedição ainda não abriu */
  complementoNovo?: boolean;
};

export type ObservacaoChamado = {
  id: string;
  chamadoId: string;
  autorId: string;
  texto: string;
  criadoEm: string;
  autor: { id: string; nome: string };
  /**
   * 'expedicao' = observação interna entre turnos (padrão);
   * 'solicitante' = complemento de quem abriu o chamado, visível para os dois lados
   */
  origem?: 'expedicao' | 'solicitante';
};
