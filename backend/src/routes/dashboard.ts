import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar } from '../middleware/auth';

const router = Router();
router.use(autenticar);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [materiais, entradasMes, saidasMes, ultimasMovimentacoes] = await Promise.all([
      prisma.material.findMany({ where: { ativo: true } }),
      prisma.movimentacao.aggregate({
        where: { tipo: 'ENTRADA', data: { gte: inicioMes } },
        _count: true,
      }),
      prisma.movimentacao.aggregate({
        where: { tipo: 'SAIDA', data: { gte: inicioMes } },
        _count: true,
      }),
      prisma.movimentacao.findMany({
        take: 8,
        orderBy: { data: 'desc' },
        include: {
          material: { select: { nome: true, categoria: true, unidade: true } },
          usuario: { select: { nome: true } },
        },
      }),
    ]);

    const estoqueBaixo = materiais.filter((m) => Number(m.estoqueAtual) < Number(m.estoqueMinimo));

    res.json({
      totalMateriais: materiais.length,
      estoqueBaixoCount: estoqueBaixo.length,
      estoqueBaixoLista: estoqueBaixo.slice(0, 10).map((m) => ({
        id: m.id,
        nome: m.nome,
        estoqueAtual: Number(m.estoqueAtual),
        estoqueMinimo: Number(m.estoqueMinimo),
        unidade: m.unidade,
      })),
      entradasMes: entradasMes._count,
      saidasMes: saidasMes._count,
      ultimasMovimentacoes: ultimasMovimentacoes.map((m) => ({
        ...m,
        quantidade: Number(m.quantidade),
      })),
    });
  })
);

export default router;
