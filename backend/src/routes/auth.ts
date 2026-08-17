import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { JWT_SECRET, autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
    }

    const usuarioEncontrado = await prisma.usuario.findUnique({ where: { usuario } });

    if (!usuarioEncontrado || !usuarioEncontrado.ativo) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuarioEncontrado.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    const payload = {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      usuario: usuarioEncontrado.usuario,
      perfil: usuarioEncontrado.perfil,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.json({ token, usuario: payload });
  })
);

router.get(
  '/me',
  autenticar,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json(req.usuario);
  })
);

router.post(
  '/trocar-senha',
  autenticar,
  asyncHandler(async (req: AuthRequest, res) => {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: 'Senha atual incorreta' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: novaSenhaHash },
    });

    res.json({ mensagem: 'Senha alterada com sucesso' });
  })
);

export default router;
