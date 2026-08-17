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
    const { tipo, materialId, dataInicio, dataFim } = req.query;

    const movimentacoes = await prisma.movimentacao.findMany({
      where: {
        ...(tipo ? { tipo: String(tipo) as any } : {}),
        ...(materialId ? { materialId: String(materialId) } : {}),
        ...(dataInicio || dataFim
          ? {
              data: {
                ...(dataInicio ? { gte: new Date(String(dataInicio)) } : {}),
                ...(dataFim ? { lte: new Date(String(dataFim)) } : {}),
              },
            }
          : {}),
      },
      include: {
        material: { select: { nome: true, categoria: true, unidade: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { data: 'desc' },
      take: 200,
    });

    res.json(
      movimentacoes.map((m) => ({
        ...m,
        quantidade: Number(m.quantidade),
      }))
    );
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { tipo, materialId, quantidade, data, fornecedor, setorDestino, motivo, observacao } = req.body;

    if (!tipo || !materialId || !quantidade || !data) {
      return res.status(400).json({ erro: 'Tipo, material, quantidade e data são obrigatórios' });
    }
    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido' });
    }
    if (Number(quantidade) <= 0) {
      return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
    }

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) return res.status(404).json({ erro: 'Material não encontrado' });

    const estoqueAtual = Number(material.estoqueAtual);
    const qtd = Number(quantidade);

    if (tipo === 'SAIDA' && qtd > estoqueAtual) {
      return res.status(400).json({
        erro: `Estoque insuficiente. Saldo atual de "${material.nome}": ${estoqueAtual} ${material.unidade}`,
      });
    }

    const novoSaldo = tipo === 'ENTRADA' ? estoqueAtual + qtd : estoqueAtual - qtd;

    const [movimentacao] = await prisma.$transaction([
      prisma.movimentacao.create({
        data: {
          tipo,
          quantidade: qtd,
          data: new Date(data),
          fornecedor: tipo === 'ENTRADA' ? fornecedor : null,
          setorDestino: tipo === 'SAIDA' ? setorDestino : null,
          motivo: tipo === 'SAIDA' ? motivo : null,
          observacao,
          materialId,
          usuarioId: req.usuario!.id,
        },
      }),
      prisma.material.update({
        where: { id: materialId },
        data: { estoqueAtual: novoSaldo },
      }),
    ]);

    await registrar({
      entidade: 'Movimentacao',
      entidadeId: movimentacao.id,
      acao: 'CRIACAO',
      detalhes: `${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${qtd} ${material.unidade} — ${material.nome}`,
      usuarioNome: req.usuario!.nome,
    });

    res.status(201).json(movimentacao);
  })
);

export default router;
