import { prisma } from '../lib/prisma';

type Acao = 'CRIACAO' | 'ALTERACAO' | 'EXCLUSAO';

interface RegistrarParams {
  entidade: string;
  entidadeId?: string;
  acao: Acao;
  detalhes?: string;
  usuarioNome: string;
}

export async function registrar({ entidade, entidadeId, acao, detalhes, usuarioNome }: RegistrarParams) {
  try {
    await prisma.registro.create({
      data: { entidade, entidadeId, acao, detalhes, usuarioNome },
    });
  } catch (err) {
    console.error('Falha ao gravar registro de auditoria:', err);
  }
}
