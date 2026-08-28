import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar, AuthRequest } from '../middleware/auth';
import { registrar } from '../utils/registrar';

const router = Router();
router.use(autenticar);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categorias = await prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
    res.json(categorias);
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    let { nome, codigo } = req.body;

    if (!nome || !codigo) {
      return res.status(400).json({ erro: 'Nome e código são obrigatórios' });
    }

    nome = String(nome).trim();
    codigo = String(codigo).trim().toUpperCase();

    if (!/^[A-Z]{2,6}$/.test(codigo)) {
      return res.status(400).json({ erro: 'O código deve ter entre 2 e 6 letras (sem números ou espaços)' });
    }

    const nomeExistente = await prisma.categoria.findUnique({ where: { nome } });
    if (nomeExistente) return res.status(409).json({ erro: 'Já existe uma categoria com esse nome' });

    const codigoExistente = await prisma.categoria.findUnique({ where: { codigo } });
    if (codigoExistente) return res.status(409).json({ erro: 'Já existe uma categoria com esse código' });

    const categoria = await prisma.categoria.create({ data: { nome, codigo } });

    await registrar({
      entidade: 'Categoria',
      entidadeId: categoria.id,
      acao: 'CRIACAO',
      detalhes: `Categoria "${categoria.nome}" (${categoria.codigo}) criada`,
      usuarioNome: req.usuario!.nome,
    });

    res.status(201).json(categoria);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existente = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada' });

    const materiaisVinculados = await prisma.material.count({ where: { categoria: existente.codigo } });
    if (materiaisVinculados > 0) {
      return res.status(400).json({
        erro: `Não é possível excluir: existem ${materiaisVinculados} material(is) cadastrados nessa categoria`,
      });
    }

    await prisma.categoria.delete({ where: { id: req.params.id } });

    await registrar({
      entidade: 'Categoria',
      entidadeId: req.params.id,
      acao: 'EXCLUSAO',
      detalhes: `Categoria "${existente.nome}" removida`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ mensagem: 'Categoria removida com sucesso' });
  })
);

export default router;
