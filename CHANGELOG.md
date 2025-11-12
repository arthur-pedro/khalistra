## [Unreleased] - 2025-11-12

### Added
- `.dockerignore` para reduzir o contexto enviado ao Docker e acelerar builds.
- Dockerfiles multistage para `@khalistra/backend` e `@khalistra/frontend`, produzindo executáveis prontos para o primeiro protótipo baseado no xadrez clássico.
- Novos serviços `frontend` e `backend` no `docker-compose.yml`, com healthchecks e dependências configuradas (PostgreSQL + Redis).
- Variáveis de ambiente explícitas para a porta do frontend e instruções atualizadas no README para subir toda a stack via `pnpm infra:up`.
- Módulo `matches` no backend NestJS com endpoints REST (`/api/matches`) alimentados pelo `@khalistra/game-engine`, emitindo logs `game:start`, `game:move`, `game:update` e `game:finish`.
- Testes unitários e E2E garantindo criação de partidas e aplicação de movimentos clássicos turno a turno.
- Atualização completa do `@khalistra/game-engine` para o tabuleiro 8×8 com regras clássicas, geração de jogadas legais (`listLegalMoves`), detecção de xeque/xeque-mate/empate e cobertura Jest refletindo os novos contratos.
- Backend NestJS agora aceita promoções, reflete o motivo real de término nas métricas/`game:finish` e mantém compatibilidade com o estado enriquecido do engine.
- Frontend Next.js convertido em um laboratório jogável com tabuleiro interativo, destaque de movimentos, painel de jogadores/histórico e integração direta com a API de partidas usando o módulo de engine compartilhado.

### Fixed
- Configuração do pacote `@khalistra/shared` como workspace válido com `package.json`, `tsconfig.json` e `eslint.config.mjs` apropriados.
- Resolução de dependências workspace no `pnpm-workspace.yaml` corrigindo referência de `shared/*` para `shared`.
- Correção dos Dockerfiles para incluir corretamente o módulo shared via symbolic links nos containers.
- Configuração do TypeScript no shared removendo `"types": ["node"]` que causava conflitos.
- Ajuste do ESLint config no shared para usar path absoluto correto e ignorar arquivos `.d.ts` e `.js` gerados.
- Conversão do `next.config.ts` para `next.config.js` para evitar problemas de transpilação no container.
- Adição de `--passWithNoTests` nos scripts de teste para permitir execução sem arquivos de teste.

### Next Steps
1. Adicionar migrations e seeds iniciais (jogadores, partidas e estados) no PostgreSQL e conectá-las ao Redis para reidratar o tabuleiro clássico a cada `game:start`.
2. Expor um handshake completo `game:join -> game:move -> game:update -> game:finish` via Socket.io/Fastify, persistindo turnos no Postgres e sincronizando o estado transiente pelo Redis.
3. Mapear o backlog pós-MVP destacando evoluções de regras dinâmicas (cartas, rituais e modificadores) e dependências técnicas para ativá-las sem quebrar o MVP.
