# NoControle

NoControle e uma aplicacao fullstack em Next.js para organizacao financeira pessoal. O projeto centraliza cadastro de receitas, despesas, dividas, cartoes, investimentos, importacao de extratos, gamificacao, comunidade e um copiloto financeiro.

## Stack

- Next.js 16 com App Router
- React 19
- TypeScript
- PostgreSQL/Neon via `@neondatabase/serverless`
- Autenticacao por cookie HTTP-only com JWT
- pnpm via Corepack

## Rodando localmente

```bash
corepack enable
corepack pnpm install
copy .env.example .env.local
corepack pnpm dev
```

Preencha `DATABASE_URL` e `JWT_SECRET` em `.env.local` antes de testar fluxos com banco e login.

## Scripts

```bash
corepack pnpm dev
corepack pnpm lint
corepack pnpm build
corepack pnpm start
```

## Banco de dados

O schema principal esta em [docs/database-schema.sql](docs/database-schema.sql). A aplicacao espera tabelas em ingles como `users`, `expenses`, `incomes`, `debts`, `plans`, `credit_cards`, entre outras, conforme usadas pelas rotas em `app/api`.

## API

A documentacao das rotas esta em [docs/api.md](docs/api.md). A maioria dos endpoints usa cookie `auth_token`, criado por `/api/auth/login` ou `/api/auth/register`.

## Deploy

### Render

O arquivo [render.yaml](render.yaml) configura um Web Service Node no plano gratuito.

Variaveis obrigatorias no Render:

- `DATABASE_URL`
- `JWT_SECRET`

Healthcheck:

- `GET /api/health`

### Vercel

Tambem e possivel publicar a aplicacao inteira na Vercel. Configure as mesmas variaveis (`DATABASE_URL` e `JWT_SECRET`) no projeto antes do deploy de producao.
