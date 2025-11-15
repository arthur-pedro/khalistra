## [Unreleased] - 2025-11-15

### Added
- **RoomsModule + Prisma:** novo modelo `Room`, enum `RoomStatus`, service/controller NestJS com geração de códigos, lobby persistido e testes unitários usando os doubles in-memory.
- **Launcher Desktop:** menu lateral fixo, formulários de criar/entrar em sala, lobby com cópia de código e painel de status/match integrado ao estado do `MatchBoard`, tudo com tema dark “cliente Steam”.

### Changed
- **ROADMAP atualizado:** redefinido o objetivo final para lançamento na Steam com foco em jogo desktop profissional.
- **Sistema de Salas:** especificado sistema de criação de salas com código (6-8 caracteres) para V1, substituindo matchmaking imediato.
- **Interface Desktop:** adicionado requisito de menu principal nativo e remoção de elementos "web-like" para aparência profissional.
- **Electron Integration:** especificado uso detalhado do Electron na Fase 6, incluindo BrowserWindow customizada, preload scripts, electron-builder e integração Steam SDK.
- **Fases Futuras:** reorganizado roadmap incluindo integração Steam SDK, matchmaking ranqueado e monetização.

## [Previous] - 2025-11-12

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
- Gateway Socket.io no backend NestJS com eventos `game:join`, `game:move`, `game:update`, `game:finish` e `game:replay`, broadcastando snapshots completos e logs estruturados.
- Tipos compartilhados para ACKs/exceções (`GameSocketAck`, `GameGatewayErrorCode`, envelopes realtime) permitindo que clientes e serviços tratem erros com o mesmo contrato.

### Fixed
- Configuração do pacote `@khalistra/shared` como workspace válido com `package.json`, `tsconfig.json` e `eslint.config.mjs` apropriados.
- Resolução de dependências workspace no `pnpm-workspace.yaml` corrigindo referência de `shared/*` para `shared`.
- Correção dos Dockerfiles para incluir corretamente o módulo shared via symbolic links nos containers.
- Configuração do TypeScript no shared removendo `"types": ["node"]` que causava conflitos.
- Ajuste do ESLint config no shared para usar path absoluto correto e ignorar arquivos `.d.ts` e `.js` gerados.
- Conversão do `next.config.ts` para `next.config.js` para evitar problemas de transpilação no container.
- Adição de `--passWithNoTests` nos scripts de teste para permitir execução sem arquivos de teste.
- Frontend Next.js agora consome o canal realtime via Socket.io com fallback HTTP apenas quando necessário, eliminando polling e garantindo replay automático em reconexões.

### Next Steps
1. Garantir contratos extensíveis no `GameStateSnapshot`, DTOs e eventos para suportar atributos extras (mana, cartas, modificadores) sem breaking changes.
2. Iniciar o esqueleto do sistema de modificadores/rituais no `@khalistra/game-engine`, mesmo que ainda desativado para o MVP.
3. Documentar no README/AGENTS como ativar novas regras via feature flags e mapear o backlog pós-MVP com foco nas evoluções de cartas e rituais.
