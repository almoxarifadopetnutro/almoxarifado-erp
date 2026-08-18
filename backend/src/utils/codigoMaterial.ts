import { prisma } from '../lib/prisma';

export const PREFIXO_CATEGORIA: Record<string, string> = {
  EPI: 'EPI',
  LIMPEZA: 'LPZ',
  ESCRITORIO: 'ESC',
  OUTROS: 'OTR',
};

/**
 * Gera o próximo código sequencial para uma categoria (ex: LPZ-001, LPZ-002...).
 * Olha o maior número já usado nessa categoria e soma 1.
 */
export async function gerarProximoCodigo(categoria: string): Promise<string> {
  const prefixo = PREFIXO_CATEGORIA[categoria] || 'OTR';

  const existentes = await prisma.material.findMany({
    where: { codigo: { startsWith: `${prefixo}-` } },
    select: { codigo: true },
  });

  let maiorNumero = 0;
  for (const m of existentes) {
    const partes = m.codigo?.split('-');
    const numero = partes ? parseInt(partes[1], 10) : NaN;
    if (!isNaN(numero) && numero > maiorNumero) maiorNumero = numero;
  }

  const proximo = maiorNumero + 1;
  return `${prefixo}-${String(proximo).padStart(3, '0')}`;
}
