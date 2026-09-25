import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar, AuthRequest } from '../middleware/auth';
import { registrar } from '../utils/registrar';
import { gerarProximoCodigo } from '../utils/codigoMaterial';
import { OBS_ESTOQUE_INICIAL, dataSaoPaulo, meioDia } from '../utils/datas';

const router = Router();
router.use(autenticar);

async function validarCategoria(categoria: string) {
  const existente = await prisma.categoria.findUnique({ where: { codigo: categoria } });
  return existente;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { busca, categoria, apenasBaixo, ordenarPor } = req.query;

    const materiais = await prisma.material.findMany({
      where: {
        ativo: true,
        ...(busca ? { nome: { contains: String(busca), mode: 'insensitive' } } : {}),
        ...(categoria ? { categoria: String(categoria) } : {}),
      },
      orderBy: ordenarPor === 'codigo' ? { codigo: 'asc' } : { nome: 'asc' },
    });

    const materiaisComStatus = materiais
      .map((m) => ({
        ...m,
        estoqueAtual: Number(m.estoqueAtual),
        estoqueMinimo: Number(m.estoqueMinimo),
        estoqueBaixo: Number(m.estoqueAtual) < Number(m.estoqueMinimo),
      }))
      .filter((m) => (apenasBaixo === 'true' ? m.estoqueBaixo : true));

    res.json(materiaisComStatus);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const material = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
    res.json({
      ...material,
      estoqueAtual: Number(material.estoqueAtual),
      estoqueMinimo: Number(material.estoqueMinimo),
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { nome, categoria, unidade, estoqueMinimo, estoqueAtual } = req.body;

    if (!nome || !categoria || !unidade) {
      return res.status(400).json({ erro: 'Nome, categoria e unidade são obrigatórios' });
    }

    const categoriaValida = await validarCategoria(categoria);
    if (!categoriaValida) {
      return res.status(400).json({ erro: 'Categoria inválida' });
    }

    const codigo = await gerarProximoCodigo(categoria);

    const qtdInicial = Number(estoqueAtual) > 0 ? Number(estoqueAtual) : 0;

    // cria o material e, se houver estoque inicial, a Entrada correspondente — tudo junto,
    // para o saldo nunca existir sem o registro no histórico de movimentações
    const material = await prisma.$transaction(async (tx) => {
      const criado = await tx.material.create({
        data: {
          codigo,
          nome,
          categoria,
          unidade,
          estoqueMinimo: estoqueMinimo ?? 0,
          estoqueAtual: qtdInicial,
        },
      });

      if (qtdInicial > 0) {
        await tx.movimentacao.create({
          data: {
            tipo: 'ENTRADA',
            quantidade: qtdInicial,
            data: meioDia(dataSaoPaulo()),
            observacao: OBS_ESTOQUE_INICIAL,
            materialId: criado.id,
            usuarioId: req.usuario!.id,
          },
        });
      }

      return criado;
    });

    await registrar({
      entidade: 'Material',
      entidadeId: material.id,
      acao: 'CRIACAO',
      detalhes: `Material "${material.nome}" cadastrado (${codigo})${qtdInicial > 0 ? ` com estoque inicial de ${qtdInicial} ${material.unidade}` : ''}`,
      usuarioNome: req.usuario!.nome,
    });

    res.status(201).json(material);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existente = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: 'Material não encontrado' });

    const { nome, categoria, unidade, estoqueMinimo } = req.body;

    // se a categoria mudou, o código precisa ser regerado para refletir o novo prefixo
    let novoCodigo = existente.codigo;
    if (categoria && categoria !== existente.categoria) {
      const categoriaValida = await validarCategoria(categoria);
      if (!categoriaValida) return res.status(400).json({ erro: 'Categoria inválida' });
      novoCodigo = await gerarProximoCodigo(categoria);
    }

    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { nome, categoria, unidade, estoqueMinimo, codigo: novoCodigo },
    });

    await registrar({
      entidade: 'Material',
      entidadeId: material.id,
      acao: 'ALTERACAO',
      detalhes: `Material "${material.nome}" atualizado`,
      usuarioNome: req.usuario!.nome,
    });

    res.json(material);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existente = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: 'Material não encontrado' });

    const movimentacoesVinculadas = await prisma.movimentacao.count({
      where: { materialId: req.params.id },
    });

    if (movimentacoesVinculadas > 0) {
      // material com histórico: inativa em vez de excluir
      await prisma.material.update({ where: { id: req.params.id }, data: { ativo: false } });
    } else {
      await prisma.material.delete({ where: { id: req.params.id } });
    }

    await registrar({
      entidade: 'Material',
      entidadeId: req.params.id,
      acao: 'EXCLUSAO',
      detalhes: `Material "${existente.nome}" removido`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ mensagem: 'Material removido com sucesso' });
  })
);

export default router;
