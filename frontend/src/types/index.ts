export type Perfil = 'ADMINISTRADOR' | 'ALMOXARIFE';
export type Categoria = 'EPI' | 'LIMPEZA' | 'ESCRITORIO' | 'OUTROS';
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

export interface Usuario {
  id: string;
  nome: string;
  usuario: string;
  perfil: Perfil;
  ativo?: boolean;
}

export interface Material {
  id: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueBaixo?: boolean;
  ativo?: boolean;
}

export interface Movimentacao {
  id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  data: string;
  fornecedor?: string | null;
  setorDestino?: string | null;
  motivo?: string | null;
  observacao?: string | null;
  material: { nome: string; categoria: Categoria; unidade: string };
  usuario: { nome: string };
}

export interface Registro {
  id: string;
  entidade: string;
  entidadeId?: string;
  acao: 'CRIACAO' | 'ALTERACAO' | 'EXCLUSAO';
  detalhes?: string;
  usuarioNome: string;
  createdAt: string;
}

export interface DashboardData {
  totalMateriais: number;
  estoqueBaixoCount: number;
  estoqueBaixoLista: { id: string; nome: string; estoqueAtual: number; estoqueMinimo: number; unidade: string }[];
  entradasMes: number;
  saidasMes: number;
  ultimasMovimentacoes: Movimentacao[];
}
