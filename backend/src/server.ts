import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import materiaisRoutes from './routes/materiais';
import movimentacoesRoutes from './routes/movimentacoes';
import usuariosRoutes from './routes/usuarios';
import registrosRoutes from './routes/registros';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Almoxarifado ERP - Pet\'s Kitchen' });
});

app.use('/auth', authRoutes);
app.use('/materiais', materiaisRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/registros', registrosRoutes);
app.use('/dashboard', dashboardRoutes);

// handler de erro global — evita que qualquer erro derrube o processo
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado na rota:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});

app.listen(PORT, () => {
  console.log(`Servidor do Almoxarifado ERP rodando na porta ${PORT}`);
});
