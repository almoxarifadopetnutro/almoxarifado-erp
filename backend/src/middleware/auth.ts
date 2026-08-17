import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuario?: {
    id: string;
    nome: string;
    usuario: string;
    perfil: 'ADMINISTRADOR' | 'ALMOXARIFE';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev-trocar-em-producao';

export function autenticar(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest['usuario'];
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function apenasAdministrador(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.usuario?.perfil !== 'ADMINISTRADOR') {
    return res.status(403).json({ erro: 'Acesso restrito ao Administrador' });
  }
  next();
}

export { JWT_SECRET };
