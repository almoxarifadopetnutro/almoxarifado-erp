/**
 * Cria a Entrada de "Estoque inicial" que faltou para os materiais cadastrados
 * antes dessa regra existir (o estoque inicial ia direto pro saldo, sem movimentação).
 *
 * NÃO altera o saldo de nenhum material — só completa o histórico.
 *
 * Uso (dentro da pasta backend):
 *   npx ts-node scripts/registrarEstoqueInicial.ts            -> só mostra o que seria criado
 *   npx ts-node scripts/registrarEstoqueInicial.ts --aplicar  -> grava as entradas no banco
 *
 * Pode rodar mais de uma vez: material cujo histórico já bate com o saldo é ignorado.
 */
import { PrismaClient } from '@prisma/client';
import { OBS_ESTOQUE_INICIAL, dataSaoPaulo, meioDia } from '../src/utils/datas';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');

const arred = (n: number) => Math.round(n * 100) / 100;

async function main() {
  const materiais = await prisma.material.findMany({
    include: { movimentacoes: { select: { tipo: true, quantidade: true, observacao: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const admin =
    (await prisma.usuario.findFirst({ where: { perfil: 'ADMINISTRADOR', ativo: true }, orderBy: { createdAt: 'asc' } })) ??
    (await prisma.usuario.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!admin) throw new Error('Nenhum usuário encontrado no banco.');

  const pendentes: { id: string; codigo: string; nome: string; unidade: string; qtd: number; data: string; usuarioId: string; usuarioNome: string }[] = [];
  const estranhos: string[] = [];

  for (const m of materiais) {
    const saldoMov = m.movimentacoes.reduce(
      (acc, mov) => acc + (mov.tipo === 'ENTRADA' ? Number(mov.quantidade) : -Number(mov.quantidade)),
      0
    );
    const diferenca = arred(Number(m.estoqueAtual) - saldoMov);

    if (diferenca === 0) continue;
    if (diferenca < 0) {
      estranhos.push(`${m.codigo ?? '-'}  ${m.nome}  (saldo ${Number(m.estoqueAtual)}, histórico ${arred(saldoMov)})`);
      continue;
    }
    if (m.movimentacoes.some((mov) => mov.tipo === 'ENTRADA' && mov.observacao === OBS_ESTOQUE_INICIAL)) {
      estranhos.push(`${m.codigo ?? '-'}  ${m.nome}  (já tem Entrada de estoque inicial, mas ainda sobra ${diferenca})`);
      continue;
    }

    // quem cadastrou o material, pelo registro de auditoria; se não achar, usa o administrador
    const registro = await prisma.registro.findFirst({
      where: { entidade: 'Material', entidadeId: m.id, acao: 'CRIACAO' },
      orderBy: { createdAt: 'asc' },
    });
    const autor = registro ? await prisma.usuario.findFirst({ where: { nome: registro.usuarioNome } }) : null;
    const usuario = autor ?? admin;

    pendentes.push({
      id: m.id,
      codigo: m.codigo ?? '-',
      nome: m.nome,
      unidade: m.unidade,
      qtd: diferenca,
      data: dataSaoPaulo(m.createdAt),
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
    });
  }

  console.log(`\n${pendentes.length} material(is) sem a Entrada de estoque inicial:\n`);
  for (const p of pendentes) {
    const [a, mm, d] = p.data.split('-');
    console.log(`  ${p.codigo.padEnd(9)} ${p.nome.slice(0, 45).padEnd(46)} ${String(p.qtd).padStart(7)} ${p.unidade.padEnd(5)} em ${d}/${mm}/${a}  (${p.usuarioNome})`);
  }
  if (estranhos.length) {
    console.log('\nAtenção — não mexi nestes (conferir manualmente):');
    estranhos.forEach((e) => console.log('  ' + e));
  }

  if (!APLICAR) {
    console.log('\nNada foi gravado. Para gravar, rode de novo com --aplicar\n');
    return;
  }

  for (const p of pendentes) {
    await prisma.movimentacao.create({
      data: {
        tipo: 'ENTRADA',
        quantidade: p.qtd,
        data: meioDia(p.data),
        observacao: OBS_ESTOQUE_INICIAL,
        materialId: p.id,
        usuarioId: p.usuarioId,
      },
    });
    await prisma.registro.create({
      data: {
        entidade: 'Movimentacao',
        acao: 'CRIACAO',
        detalhes: `Entrada de estoque inicial (retroativa) de ${p.qtd} ${p.unidade} — ${p.nome}`,
        usuarioNome: 'Sistema (ajuste de histórico)',
      },
    });
  }
  console.log(`\n${pendentes.length} Entrada(s) gravada(s). Saldos não foram alterados.\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
