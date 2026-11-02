export type Papel = 'agente' | 'supervisor';

export type UsoNumeroWhatsapp = 'clientes' | 'motorista';

export type NumeroWhatsapp = {
  id: string;
  uso: UsoNumeroWhatsapp;
  label: string;
  phoneNumberId: string;
  descricao?: string;
};

export type Setor = {
  id: string;
  nome: string;
  slaMinutos?: number;
  numeroWhatsappId?: string | null;
  numeroWhatsapp?: Pick<NumeroWhatsapp, 'id' | 'uso' | 'label' | 'phoneNumberId'> | null;
};

export type User = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  setores: Setor[];
};

export type Atendimento = {
  id: string;
  tipo: 'ocorrencia' | 'conversa';
  setorId: string | null;
  contatoTelefone: string;
  contatoNome: string | null;
  status: 'aguardando' | 'em_atendimento' | 'encerrada';
  assumidoPorId: string | null;
  slaVenceEm: string | null;
  motoristaNaoIdentificado: boolean;
  conversaLimpaPorId: string | null;
  conversaLimpaEm: string | null;
  ultimaMensagemPreview: string | null;
  criadoEm: string;
  atualizadoEm: string;
  setor?: Setor | null;
  assumidoPor?: { id: string; nome: string } | null;
  conversaLimpaPor?: { id: string; nome: string } | null;
};

export type Mensagem = {
  id: string;
  atendimentoId: string;
  direcao: 'entrada' | 'saida';
  remetenteUsuarioId: string | null;
  conteudo: string | null;
  enviadoEm: string;
  remetenteUsuario?: { id: string; nome: string } | null;
};

export type Motorista = {
  id: string;
  nome: string;
  telefone: string;
  placa: string | null;
  ativo: boolean;
};

export type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export type CamposChamado = {
  clienteNome: string;
  clienteEmail: string;
  destino: string;
  notaFiscal: string;
  tipoVeiculo: string;
  peso: string;
  horarioLimite: string;
};

export type CamposExtraidosIA = { [K in keyof CamposChamado]: string | null };

export type Chamado = {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  destino: string;
  notaFiscal: string | null;
  tipoVeiculo: string;
  peso: string;
  horarioLimite: string;
  status: StatusChamado;
  criadoPorId: string;
  assumidoPorId: string | null;
  resolvidoEm: string | null;
  emailConfirmacaoEnviadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: { id: string; nome: string };
  assumidoPor: { id: string; nome: string } | null;
  _count?: { observacoes: number };
};

export type ChamadoObservacao = {
  id: string;
  chamadoId: string;
  autorId: string;
  texto: string;
  criadoEm: string;
  autor: { id: string; nome: string };
};

export type ChamadoDetalhe = Omit<Chamado, 'criadoPor' | '_count'> & {
  emailOriginalTexto: string;
  criadoPor: { id: string; nome: string; email: string };
  observacoes: ChamadoObservacao[];
};

export type ResultadoEmailChamado = {
  chamado: Chamado;
  emailEnviado: boolean;
  emailErro?: string;
};

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  setores: Setor[];
};
