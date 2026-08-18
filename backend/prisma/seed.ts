import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PREFIXO_CATEGORIA: Record<string, string> = {
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

  // backfill: gera código para materiais cadastrados antes dessa funcionalidade existir
  const semCodigo = await prisma.material.findMany({
    where: { codigo: null },
    orderBy: { createdAt: 'asc' },
  });

  if (semCodigo.length > 0) {
    const contadorPorCategoria: Record<string, number> = {};

    // descobre o maior número já usado em cada categoria, pra não colidir com códigos existentes
    const todosComCodigo = await prisma.material.findMany({
      where: { codigo: { not: null } },
      select: { codigo: true },
    });
    for (const m of todosComCodigo) {
      const partes = m.codigo?.split('-');
      const prefixo = partes?.[0];
      const numero = partes ? parseInt(partes[1], 10) : NaN;
      if (prefixo && !isNaN(numero)) {
        contadorPorCategoria[prefixo] = Math.max(contadorPorCategoria[prefixo] || 0, numero);
      }
    }

    for (const material of semCodigo) {
      const prefixo = PREFIXO_CATEGORIA[material.categoria] || 'OTR';
      contadorPorCategoria[prefixo] = (contadorPorCategoria[prefixo] || 0) + 1;
      const codigo = `${prefixo}-${String(contadorPorCategoria[prefixo]).padStart(3, '0')}`;

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
