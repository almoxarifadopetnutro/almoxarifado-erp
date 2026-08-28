export type Perfil = 'ADMINISTRADOR' | 'ALMOXARIFE';
export type Categoria = string; // agora é o código da categoria (ex: "LPZ", "EPI") — dinâmico, cadastrado pelo usuário
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

export interface CategoriaInfo {
  id: string;
  nome: string;
  codigo: string;
}

export interface Usuario {
  id: string;
  nome: string;
  usuario: string;
  perfil: Perfil;
  ativo?: boolean;
}

export interface Material {
  id: string;
  codigo?: string | null;
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
