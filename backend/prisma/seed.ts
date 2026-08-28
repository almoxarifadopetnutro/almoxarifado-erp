import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// categorias padrão do sistema — nome de exibição + código/prefixo
const CATEGORIAS_PADRAO = [
  { nome: 'EPI', codigo: 'EPI' },
  { nome: 'Limpeza', codigo: 'LPZ' },
  { nome: 'Escritório', codigo: 'ESC' },
  { nome: 'Outros', codigo: 'OTR' },
];

// mapeia o valor antigo (enum) salvo nos materiais para o novo código de categoria
const MIGRACAO_CATEGORIA_ANTIGA: Record<string, string> = {
  EPI: 'EPI',
  LIMPEZA: 'LPZ',
  ESCRITORIO: 'ESC',
  OUTROS: 'OTR',
};

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nome: 'Administrador',
      usuario: 'admin',
      senha: senhaHash,
      perfil: 'ADMINISTRADOR',
    },
  });

  console.log('Seed concluído: usuário admin garantido (senha inicial 123456).');

  // garante que as 4 categorias padrão existem
  for (const cat of CATEGORIAS_PADRAO) {
    await prisma.categoria.upsert({
      where: { codigo: cat.codigo },
      update: {},
      create: cat,
    });
  }
  console.log('Seed: categorias padrão garantidas (EPI, LPZ, ESC, OTR).');

  // migra materiais que ainda estão com o valor antigo de categoria (ex: "LIMPEZA") para o novo código (ex: "LPZ")
  for (const [valorAntigo, novoCodigo] of Object.entries(MIGRACAO_CATEGORIA_ANTIGA)) {
    if (valorAntigo === novoCodigo) continue; // EPI já é igual, não precisa migrar
    const resultado = await prisma.material.updateMany({
      where: { categoria: valorAntigo },
      data: { categoria: novoCodigo },
    });
    if (resultado.count > 0) {
      console.log(`Seed: ${resultado.count} material(is) migrados de "${valorAntigo}" para "${novoCodigo}".`);
    }
  }

  // backfill: gera código para materiais cadastrados antes dessa funcionalidade existir
  const semCodigo = await prisma.material.findMany({
    where: { codigo: null },
    orderBy: { createdAt: 'asc' },
  });

  if (semCodigo.length > 0) {
    const contadorPorPrefixo: Record<string, number> = {};

    const todosComCodigo = await prisma.material.findMany({
      where: { codigo: { not: null } },
      select: { codigo: true },
    });
    for (const m of todosComCodigo) {
      const partes = m.codigo?.split('-');
      const prefixo = partes?.[0];
      const numero = partes ? parseInt(partes[1], 10) : NaN;
      if (prefixo && !isNaN(numero)) {
        contadorPorPrefixo[prefixo] = Math.max(contadorPorPrefixo[prefixo] || 0, numero);
      }
    }

    for (const material of semCodigo) {
      const prefixo = material.categoria; // categoria agora já é o prefixo (ex: "LPZ")
      contadorPorPrefixo[prefixo] = (contadorPorPrefixo[prefixo] || 0) + 1;
      const codigo = `${prefixo}-${String(contadorPorPrefixo[prefixo]).padStart(3, '0')}`;

      await prisma.material.update({ where: { id: material.id }, data: { codigo } });
    }

    console.log(`Seed: ${semCodigo.length} material(is) receberam código automático.`);
  }
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
