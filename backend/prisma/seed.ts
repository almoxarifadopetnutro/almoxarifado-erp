import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
