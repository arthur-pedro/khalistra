## [Unreleased] - 2025-01-09

### Added
- `.dockerignore` para reduzir o contexto enviado ao Docker e acelerar builds.
- Dockerfiles multistage para `@khalistra/backend` e `@khalistra/frontend`, produzindo executáveis prontos para o primeiro protótipo baseado no xadrez clássico.
- Novos serviços `frontend` e `backend` no `docker-compose.yml`, com healthchecks e dependências configuradas (PostgreSQL + Redis).
- Variáveis de ambiente explícitas para a porta do frontend e instruções atualizadas no README para subir toda a stack via `pnpm infra:up`.
- Módulo `matches` no backend NestJS com endpoints REST (`/api/matches`) alimentados pelo `@khalistra/game-engine`, emitindo logs `game:start`, `game:move`, `game:update` e `game:finish`.
- Testes unitários e E2E garantindo criação de partidas e aplicação de movimentos clássicos turno a turno.

### Next Steps
1. Adicionar seeds e migrations iniciais no PostgreSQL para partidas e jogadores, garantindo integração com Redis para estados transitórios.
2. Criar testes de de unidade que validem movimentos básicos através do stack dockerizado.
