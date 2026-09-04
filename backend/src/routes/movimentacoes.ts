import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar, AuthRequest } from '../middleware/auth';
import { registrar } from '../utils/registrar';

const router = Router();
router.use(autenticar);

/**
 * Converte uma data recebida do frontend (ex: "2026-09-03" ou um ISO completo)
 * em um Date fixado ao meio-dia local, evitando que o fuso horário (UTC-3)
 * "empurre" a data pro dia anterior quando não há horário informado.
 */
function parseDataLocal(valor: string): Date {
  const soData = String(valor).slice(0, 10); // pega só "AAAA-MM-DD"
  const [ano, mes, dia] = soData.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

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
                ...(dataInicio ? { gte: parseDataLocal(String(dataInicio)) } : {}),
                ...(dataFim ? { lte: parseDataLocal(String(dataFim)) } : {}),
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
          data: parseDataLocal(data),
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

router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { tipo, materialId, quantidade, data, fornecedor, setorDestino, motivo, observacao } = req.body;

    if (!tipo || !materialId || !quantidade || !data) {
      return res.status(400).json({ erro: 'Tipo, material, quantidade e data são obrigatórios' });
    }
    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido' });
    }
    const qtdNova = Number(quantidade);
    if (qtdNova <= 0) {
      return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
    }

    const movimentacaoAtual = await prisma.movimentacao.findUnique({ where: { id: req.params.id } });
    if (!movimentacaoAtual) return res.status(404).json({ erro: 'Movimentação não encontrada' });

    const materialNovo = await prisma.material.findUnique({ where: { id: materialId } });
    if (!materialNovo) return res.status(404).json({ erro: 'Material não encontrado' });

    const qtdAntiga = Number(movimentacaoAtual.quantidade);
    const materialMudou = movimentacaoAtual.materialId !== materialId;

    const dadosMovimentacao = {
      tipo,
      materialId,
      quantidade: qtdNova,
      data: parseDataLocal(data),
      fornecedor: tipo === 'ENTRADA' ? fornecedor : null,
      setorDestino: tipo === 'SAIDA' ? setorDestino : null,
      motivo: tipo === 'SAIDA' ? motivo : null,
      observacao,
    };

    if (materialMudou) {
      // material trocado: reverte o efeito no material antigo e aplica o novo efeito no material novo
      const materialAntigo = await prisma.material.findUnique({ where: { id: movimentacaoAtual.materialId } });
      if (!materialAntigo) return res.status(404).json({ erro: 'Material original não encontrado' });

      const saldoAntigoRevertido =
        movimentacaoAtual.tipo === 'ENTRADA'
          ? Number(materialAntigo.estoqueAtual) - qtdAntiga
          : Number(materialAntigo.estoqueAtual) + qtdAntiga;

      if (saldoAntigoRevertido < 0) {
        return res.status(400).json({
          erro: `Não é possível editar: o saldo de "${materialAntigo.nome}" ficaria negativo ao reverter a movimentação original.`,
        });
      }

      const saldoNovoAplicado =
        tipo === 'ENTRADA'
          ? Number(materialNovo.estoqueAtual) + qtdNova
          : Number(materialNovo.estoqueAtual) - qtdNova;

      if (saldoNovoAplicado < 0) {
        return res.status(400).json({
          erro: `Estoque insuficiente de "${materialNovo.nome}" para essa saída.`,
        });
      }

      await prisma.$transaction([
        prisma.material.update({ where: { id: materialAntigo.id }, data: { estoqueAtual: saldoAntigoRevertido } }),
        prisma.material.update({ where: { id: materialNovo.id }, data: { estoqueAtual: saldoNovoAplicado } }),
        prisma.movimentacao.update({ where: { id: req.params.id }, data: dadosMovimentacao }),
      ]);
    } else {
      // mesmo material: reverte o efeito antigo e aplica o novo em uma única conta
      const saldoBase =
        movimentacaoAtual.tipo === 'ENTRADA'
          ? Number(materialNovo.estoqueAtual) - qtdAntiga
          : Number(materialNovo.estoqueAtual) + qtdAntiga;

      const saldoFinal = tipo === 'ENTRADA' ? saldoBase + qtdNova : saldoBase - qtdNova;

      if (saldoFinal < 0) {
        return res.status(400).json({
          erro: `Não é possível salvar: o saldo de "${materialNovo.nome}" ficaria negativo.`,
        });
      }

      await prisma.$transaction([
        prisma.material.update({ where: { id: materialNovo.id }, data: { estoqueAtual: saldoFinal } }),
        prisma.movimentacao.update({ where: { id: req.params.id }, data: dadosMovimentacao }),
      ]);
    }

    await registrar({
      entidade: 'Movimentacao',
      entidadeId: req.params.id,
      acao: 'EDICAO',
      detalhes: `Movimentação de "${materialNovo.nome}" editada (${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${qtdNova} ${materialNovo.unidade})`,
      usuarioNome: req.usuario!.nome,
    });

    const atualizada = await prisma.movimentacao.findUnique({
      where: { id: req.params.id },
      include: {
        material: { select: { nome: true, categoria: true, unidade: true } },
        usuario: { select: { nome: true } },
      },
    });

    res.json({ ...atualizada, quantidade: Number(atualizada!.quantidade) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const movimentacao = await prisma.movimentacao.findUnique({
      where: { id: req.params.id },
      include: { material: true },
    });
    if (!movimentacao) return res.status(404).json({ erro: 'Movimentação não encontrada' });

    const estoqueAtual = Number(movimentacao.material.estoqueAtual);
    const qtd = Number(movimentacao.quantidade);

    // reverte o efeito da movimentação no saldo do material
    const novoSaldo = movimentacao.tipo === 'ENTRADA' ? estoqueAtual - qtd : estoqueAtual + qtd;

    if (novoSaldo < 0) {
      return res.status(400).json({
        erro: `Não é possível excluir: o saldo de "${movimentacao.material.nome}" ficaria negativo (já houve saídas desde essa entrada). Ajuste as movimentações mais recentes primeiro.`,
      });
    }

    await prisma.$transaction([
      prisma.movimentacao.delete({ where: { id: req.params.id } }),
      prisma.material.update({ where: { id: movimentacao.materialId }, data: { estoqueAtual: novoSaldo } }),
    ]);

    await registrar({
      entidade: 'Movimentacao',
      entidadeId: req.params.id,
      acao: 'EXCLUSAO',
      detalhes: `${movimentacao.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${qtd} ${movimentacao.material.unidade} — ${movimentacao.material.nome} excluída (saldo revertido)`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ mensagem: 'Movimentação excluída e saldo ajustado com sucesso' });
  })
);

export default router;
