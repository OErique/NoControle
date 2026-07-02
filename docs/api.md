# API NoControle

Base URL local: `http://localhost:3000`

Base URL em producao: use o dominio publicado na Vercel.

## Autenticacao

A API usa cookie HTTP-only chamado `auth_token`. Primeiro crie uma conta ou faca login; depois o navegador envia o cookie automaticamente nas chamadas autenticadas.

### `POST /api/auth/register`

Cria usuario e inicia sessao.

Body:

```json
{
  "name": "Nome do Usuario",
  "email": "usuario@email.com",
  "password": "senha-com-8-caracteres"
}
```

### `POST /api/auth/login`

Autentica usuario existente.

Body:

```json
{
  "email": "usuario@email.com",
  "password": "senha-com-8-caracteres"
}
```

### `GET /api/auth/me`

Retorna o usuario autenticado.

### `POST /api/auth/logout`

Remove o cookie de autenticacao.

## Saude

### `GET /api/health`

Retorna status do servico e se ha variavel de banco configurada.

## Usuario

- `PATCH /api/user/profile`
- `POST /api/user/password`
- `POST /api/user/onboarding`
- `POST /api/user/upgrade`
- `DELETE /api/user/delete`

## Financas

- `GET /api/finances/summary`
- `POST /api/expenses`
- `DELETE /api/expenses/{id}`
- `POST /api/incomes`
- `DELETE /api/incomes/{id}`
- `GET /api/insights`

## Dividas

- `GET /api/debts`
- `POST /api/debts`
- `PATCH /api/debts/{id}`
- `DELETE /api/debts/{id}`
- `POST /api/debts/{id}/payments`

## Cartoes

- `GET /api/credit-cards`
- `POST /api/credit-cards`
- `GET /api/credit-cards/{cardId}`
- `PUT /api/credit-cards/{cardId}`
- `DELETE /api/credit-cards/{cardId}`
- `GET /api/credit-cards/invoices`

## Investimentos

- `GET /api/investments`
- `POST /api/investments`
- `PATCH /api/investments/{id}`
- `DELETE /api/investments/{id}`
- `GET /api/investments/types`
- `POST /api/investments/refresh-prices`

## Importacao

- `POST /api/import/parse`
- `POST /api/import/confirm`
- `GET /api/import/history`

## Gamificacao, loja e desafios

- `POST /api/streak/register`
- `GET /api/inventory`
- `POST /api/inventory/activate`
- `GET /api/shop`
- `POST /api/shop/purchase`
- `POST /api/challenges/start`
- `POST /api/challenges/progress`
- `GET /api/challenges/progress`
- `POST /api/challenges/complete`
- `POST /api/challenges/cancel`

## Comunidade e dicas

- `GET /api/community/feed`
- `GET /api/community/ranking`
- `POST /api/community/like/{feedId}`
- `DELETE /api/community/delete/{feedId}`
- `GET /api/tips`
- `POST /api/tips`
- `DELETE /api/tips/{tipId}/delete`
- `GET /api/tips/{tipId}/responses`
- `POST /api/tips/{tipId}/responses`
- `DELETE /api/tips/responses/{responseId}/delete`
- `POST /api/tips/responses/{responseId}/helpful`

## Perfil compartilhado

- `GET /api/shared/profile`
- `POST /api/shared/invite`
- `GET /api/shared/invites`
- `POST /api/shared/accept`
- `POST /api/shared/reject`
- `POST /api/shared/end`
- `POST /api/shared/unlink`
- `PATCH /api/shared/settings`
- `GET /api/shared/dashboard`
- `GET /api/shared/insights`
- `GET /api/shared/expenses`
- `POST /api/shared/expenses`
- `PUT /api/shared/expenses/{expenseId}`
- `DELETE /api/shared/expenses/{expenseId}`
- `GET /api/shared/goals`
- `POST /api/shared/goals`
- `PATCH /api/shared/goals/{goalId}`
- `DELETE /api/shared/goals/{goalId}`
- `POST /api/shared/goals/{goalId}/contribute`
- `POST /api/shared/achievements/check`

## Apostas

- `POST /api/gambling/enable`
- `PATCH /api/gambling/settings`
- `GET /api/gambling/stats`
- `GET /api/gambling/bets`
- `POST /api/gambling/bets`
- `DELETE /api/gambling/bets/{id}`

## Copiloto

- `POST /api/copilot/chat`
- `GET /api/copilot/chat`
- `DELETE /api/copilot/chat`
- `POST /api/copilot/ask`
- `POST /api/copilot/action`
- `POST /api/copilot/report`

## Perfil publico e notificacoes

- `GET /api/profile/{userId}`
- `PATCH /api/profile/update`
- `POST /api/profile/avatar`
- `DELETE /api/profile/avatar`
- `PATCH /api/profile/customize`
- `PATCH /api/profile/privacy`
- `GET /api/notifications`
- `POST /api/notifications/create`
- `DELETE /api/notifications/{id}`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`

## Planos e tema

- `GET /api/plans`
- `PATCH /api/theme`
