# @khalistra/backend

Serviço NestJS responsável por expor a API de partidas. A engine continua isolada em `@khalistra/game-engine`, enquanto este serviço cuida de:

- Persistência dos jogadores, partidas, movimentos e snapshots via **PostgreSQL + Prisma**
- Estado volátil e reidratação de partidas em andamento usando **Redis**
- Exposição de endpoints REST (futuros eventos Socket.io virão na próxima fase)

## Requisitos

- Node.js 20+
- Banco PostgreSQL acessível via `DATABASE_URL`
- Instância Redis acessível via `REDIS_URL`

## Configuração

1. Copie o arquivo de exemplo e ajuste as variáveis:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
2. Instale as dependências (na raiz do monorepo):
   ```bash
   pnpm install
   ```
3. Execute as migrations do Prisma:
   ```bash
   pnpm --filter @khalistra/backend exec prisma migrate deploy
   ```
4. Popule jogadores e o snapshot clássico com o seed:
   ```bash
   pnpm --filter @khalistra/backend exec prisma db seed
   ```

## Scripts úteis

```bash
pnpm --filter @khalistra/backend start:dev   # Nest em modo watch
pnpm --filter @khalistra/backend lint        # ESLint
pnpm --filter @khalistra/backend test        # Unit tests
pnpm --filter @khalistra/backend test:e2e    # Testes e2e (usam serviços in-memory)
```

## Estrutura de Persistência

- `prisma/schema.prisma`: modelos `Player`, `Match`, `MatchSnapshot` e `MoveRecord`
- `prisma/migrations/**`: evolução do schema no PostgreSQL
- `prisma/seed.ts`: cria dois jogadores (`player-a` / `player-b`) e um snapshot clássico (`demo-classic`)

## Redis & Reidratação

`MatchesService` sempre consulta o Redis antes de bater no banco. Quando o backend inicia:

1. Busca partidas com `status !== 'completed'` no PostgreSQL
2. Reidrata o último snapshot de cada uma e salva no Redis
3. Novas partidas usam o estado clássico vindo do banco + engine

Assim, reinícios do backend mantêm as sessões vivas e reduzem a latência entre polls/realtime.

## Endpoints

- `POST /api/matches`: cria uma partida clássica (dois IDs de jogadores)
- `GET /api/matches/:matchId`: recupera o snapshot atual
- `POST /api/matches/:matchId/moves`: aplica um movimento (validado pela engine)

As respostas sempre incluem `state` e o evento `game:update`, alinhado ao contrato do frontend.
