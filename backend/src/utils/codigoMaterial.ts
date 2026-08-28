import { prisma } from '../lib/prisma';

/**
 * Gera o próximo código sequencial para uma categoria (ex: LPZ-001, LPZ-002...).
 * O parâmetro categoriaCodigo já é o prefixo (ex: "LPZ", "EPI", "RAC").
 * Olha o maior número já usado com esse prefixo e soma 1.
 */
export async function gerarProximoCodigo(categoriaCodigo: string): Promise<string> {
  const prefixo = categoriaCodigo.toUpperCase();

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
