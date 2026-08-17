# Almoxarifado ERP — Pet's Kitchen

Sistema para controle de materiais de apoio (EPI, limpeza, escritório e outros),
independente do PCP ERP de produção. Estoque único e centralizado, controlado
apenas pela pessoa responsável pelo almoxarifado.

## Stack

- **Backend**: Node.js + Express + Prisma + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Banco**: PostgreSQL (Neon)
- **Deploy**: Vercel (frontend) + Render (backend)

## Estrutura

```
almoxarifado-erp/
  backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      routes/        (auth, materiais, movimentacoes, usuarios, registros, dashboard)
      middleware/     (autenticação JWT)
      lib/            (cliente Prisma)
      utils/          (asyncHandler, auditoria)
      server.ts
  frontend/
    src/
      pages/          (Login, Dashboard, Materiais, Movimentações, Relatórios, Usuários)
      components/     (Layout, ProtectedRoute)
      context/        (AuthContext)
      services/       (api.ts)
```

## Rodando localmente

### Backend
```bash
cd backend
npm install
cp .env.example .env    # preencher DATABASE_URL com o Neon
npx prisma migrate dev --name init
npm run seed             # cria o usuário admin / 123456
npm run dev               # http://localhost:3333
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL apontando pro backend
npm run dev               # http://localhost:5173
```

## Deploy (conta nova em tudo, separada do PCP ERP e do Nutroplus)

1. **GitHub**: criar repositório novo (ex: `almoxarifado-erp`) numa conta própria,
   com as pastas `backend/` e `frontend/` juntas, igual ao Nutroplus.
2. **Neon**: criar projeto novo, copiar a `DATABASE_URL`.
3. **Render** (backend):
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx prisma migrate deploy && npm run seed && npm start`
   - Variáveis: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (atualizar depois do deploy do frontend)
4. **Vercel** (frontend):
   - Root Directory: `frontend`
   - Variável: `VITE_API_URL` apontando para a URL do backend no Render
5. Depois do primeiro deploy do frontend, voltar no Render e atualizar `CORS_ORIGIN`
   com a URL final da Vercel (mesmo passo que deu trabalho no PCP ERP).
6. Login inicial: usuário `admin`, senha `123456` — trocar depois do primeiro acesso.

## Próximos passos sugeridos

- Criar workflow de keep-alive (GitHub Actions) pro backend do Render, igual aos outros dois projetos
- Conectar subdomínio próprio, se fizer sentido (ex: almoxarifado.petskicthen.com.br)
- Cadastrar os materiais reais e ajustar categorias/unidades conforme o uso
