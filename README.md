# Khalistra Monorepo

Monorepo do projeto Khalistra com frontend Next.js, backend NestJS/Fastify e pacotes compartilhados para contratos de eventos e utilidades. O workspace usa pnpm + Turborepo, seguindo as diretrizes em `AGENTS.md` e o lore em `docs/`.

## Estrutura Atual

- `apps/frontend`: Aplicação Next.js + Tailwind com narrativa e visão geral do projeto.
- `apps/backend`: API NestJS com Fastify, Helmet e CORS, expondo um healthcheck tipado.
- `shared`: Tipos, constantes e utilidades compartilhadas entre módulos e apps.
- `modules`: Pastas reservadas para domínios (`auth`, `users`, `matchmaking`, `game-engine`, `realtime`).

## Infra Local (Docker)

1. Copie `.env.example` para `.env` e ajuste credenciais se necessário. O `docker-compose` usa automaticamente `.env.docker`.
2. Execute `pnpm infra:up` para construir os executáveis (Next.js e NestJS) e subir toda a stack (`frontend`, `backend`, `postgres`, `redis`). A primeira execução leva alguns minutos porque as imagens multistage instalam dependências e empacotam apenas o que é necessário em produção.
3. Acesse `http://localhost:3000` para a interface web baseada no xadrez clássico e `http://localhost:3001/api` para o backend Fastify.
4. Para desligar e opcionalmente limpar volumes, rode `pnpm infra:down`.

## API (Protótipo)

- `POST /api/matches`: cria uma partida 1v1 com base no módulo `@khalistra/game-engine`. Recebe os IDs dos jogadores e retorna o snapshot completo + evento `game:update`.
- `GET /api/matches/:matchId`: recupera o estado atual da partida (histórico, peças e turno ativo).
- `POST /api/matches/:matchId/moves`: aplica um movimento clássico (coordenadas `to`) validado pelo motor. Emite logs estruturados `game:move` e, quando aplicável, `game:finish`.

Os estados permanecem em memória durante o protótipo; o próximo passo é persistir em PostgreSQL/Redis para suportar sessões reais.

## Módulos e Testes

- `modules/game-engine`: fornece `createInitialState`, `applyMove` e `stateToUpdateEvent`, aproveitando `@khalistra/shared`. Os testes (`__tests__/engine.spec.ts`) cobrem criação, validação de turno e vitórias ao capturar peças-alvo.
- Outros módulos (`auth`, `users`, `matchmaking`, `realtime`) permanecem como limites definidos no roadmap para receber novas lógicas.

Execute `pnpm lint` e `pnpm test` para validar todos os pacotes (via Turborepo).

## CI

A pipeline `Khalistra CI` (`.github/workflows/ci.yml`) roda em pushes/PRs para `main`, garantindo `pnpm install`, lint e testes antes de qualquer merge.

Mantenha o checklist de PRs do `AGENTS.md` e escreva testes para toda lógica crítica.
