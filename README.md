# Khalistra Monorepo

Monorepo do projeto Khalistra com frontend Next.js, backend NestJS/Fastify e pacotes compartilhados para contratos de eventos e utilidades. O workspace usa pnpm + Turborepo, seguindo as diretrizes em `AGENTS.md` e o lore em `docs/`.

## Estrutura Atual

- `apps/frontend`: Aplicação Next.js + Tailwind com narrativa e visão geral do projeto.
- `apps/backend`: API NestJS com Fastify, Helmet e CORS, expondo um healthcheck tipado.
- `shared`: Tipos, constantes e utilidades compartilhadas entre módulos e apps.
- `modules`: Pastas reservadas para domínios (`auth`, `users`, `matchmaking`, `game-engine`, `realtime`).

## Infra Local (Docker)

1. Copie `.env.example` para `.env` e ajuste credenciais se necessário. Os containers usam os valores de `.env.docker` por padrão.
2. Suba PostgreSQL + Redis: `pnpm infra:up`. Os dados persistem nos volumes `postgres_data` e `redis_data`.
3. Para desligar e limpar volumes, use `pnpm infra:down`.

## Módulos e Testes

- `modules/game-engine`: fornece `createInitialState`, `applyMove` e `stateToUpdateEvent`, aproveitando `@khalistra/shared`. Os testes (`__tests__/engine.spec.ts`) cobrem criação, validação de turno e vitórias ao capturar peças-alvo.
- Outros módulos (`auth`, `users`, `matchmaking`, `realtime`) permanecem como limites definidos no roadmap para receber novas lógicas.

Execute `pnpm lint` e `pnpm test` para validar todos os pacotes (via Turborepo).

## CI

A pipeline `Khalistra CI` (`.github/workflows/ci.yml`) roda em pushes/PRs para `main`, garantindo `pnpm install`, lint e testes antes de qualquer merge.

Mantenha o checklist de PRs do `AGENTS.md` e escreva testes para toda lógica crítica.
