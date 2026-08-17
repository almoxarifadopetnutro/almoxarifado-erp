import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar, apenasAdministrador, AuthRequest } from '../middleware/auth';
import { registrar } from '../utils/registrar';

const router = Router();
router.use(autenticar, apenasAdministrador);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, usuario: true, perfil: true, ativo: true, createdAt: true },
      orderBy: { nome: 'asc' },
    });
    res.json(usuarios);
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { nome, usuario, senha, perfil } = req.body;
    if (!nome || !usuario || !senha) {
      return res.status(400).json({ erro: 'Nome, usuário e senha são obrigatórios' });
    }

    const existente = await prisma.usuario.findUnique({ where: { usuario } });
    if (existente) return res.status(409).json({ erro: 'Nome de usuário já existe' });

    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = await prisma.usuario.create({
      data: { nome, usuario, senha: senhaHash, perfil: perfil ?? 'ALMOXARIFE' },
    });

    await registrar({
      entidade: 'Usuario',
      entidadeId: novoUsuario.id,
      acao: 'CRIACAO',
      detalhes: `Usuário "${novoUsuario.nome}" (${novoUsuario.usuario}) criado`,
      usuarioNome: req.usuario!.nome,
    });

    res.status(201).json({ id: novoUsuario.id, nome: novoUsuario.nome, usuario: novoUsuario.usuario });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existente = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const { nome, perfil, ativo } = req.body;
    const atualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { nome, perfil, ativo },
    });

    await registrar({
      entidade: 'Usuario',
      entidadeId: atualizado.id,
      acao: 'ALTERACAO',
      detalhes: `Usuário "${atualizado.nome}" atualizado`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ id: atualizado.id, nome: atualizado.nome, perfil: atualizado.perfil, ativo: atualizado.ativo });
  })
);

router.post(
  '/:id/redefinir-senha',
  asyncHandler(async (req: AuthRequest, res) => {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({ where: { id: req.params.id }, data: { senha: senhaHash } });

    await registrar({
      entidade: 'Usuario',
      entidadeId: usuario.id,
      acao: 'ALTERACAO',
      detalhes: `Senha do usuário "${usuario.nome}" redefinida pelo administrador`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ mensagem: 'Senha redefinida com sucesso' });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existente = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: 'Usuário não encontrado' });

    if (existente.id === req.usuario!.id) {
      return res.status(400).json({ erro: 'Você não pode excluir o próprio usuário' });
    }

    const movimentacoesVinculadas = await prisma.movimentacao.count({
      where: { usuarioId: req.params.id },
    });

    if (movimentacoesVinculadas > 0) {
      // usuário com histórico: inativa em vez de excluir, igual ao Material
      await prisma.usuario.update({ where: { id: req.params.id }, data: { ativo: false } });
    } else {
      await prisma.usuario.delete({ where: { id: req.params.id } });
    }

    await registrar({
      entidade: 'Usuario',
      entidadeId: req.params.id,
      acao: 'EXCLUSAO',
      detalhes: `Usuário "${existente.nome}" removido`,
      usuarioNome: req.usuario!.nome,
    });

    res.json({ mensagem: 'Usuário removido com sucesso' });
  })
);

export default router;
