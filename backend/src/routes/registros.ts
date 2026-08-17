import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { autenticar } from '../middleware/auth';

const router = Router();
router.use(autenticar);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const registros = await prisma.registro.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    res.json(registros);
  })
);

export default router;
