## ROADMAP — Primeira Parcela Jogável

**Objetivo:** consolidar o protótipo clássico (regras básicas inspiradas no xadrez) com engine, backend e frontend integrados, garantindo persistência e telemetria suficientes para destravar as regras exclusivas de Khalistra sem refatorações estruturais.

> Sempre alinhar este roadmap com `docs/AGENTS.md` e `docs/mechs/**` antes de iniciar qualquer item.

---

### 1. Estado Persistido & Sessões

- [x] **Migrations + Seeds:** modelar jogadores, partidas, movimentos e snapshots em PostgreSQL usando Prisma (ou equivalente) com seeds mínimos para testes locais.
- [x] **Hydratação via Redis:** ao receber `game:start`, carregar o snapshot clássico do banco e manter o estado volátil no Redis para permitir reconexões rápidas.
- [x] **Reidratação automática:** sempre que o backend reiniciar, restaurar partidas em andamento combinando PostgreSQL (histórico) + Redis (estado atual).

### 2. Canal Realtime Completo

- [x] **Handshake Socket.io:** implementar fluxo `game:join -> game:move -> game:update -> game:finish`, sincronizando com o módulo matches existente.
- [x] **Ack + Erros padronizados:** cada evento deve ter confirmação ou erro tipado baseado em `@khalistra/shared/types`.
- [x] **Replay sob demanda:** permitir que novos clientes obtenham o snapshot mais recente ao assinar o canal da partida.

### 3. Frontend Arena Ritual + PixiJS

- [x] **Client State Store:** Zustand coordena snapshots, seleção, submissão de jogadas e legal moves compartilhados entre tabuleiro, HUD e log.
- [x] **Módulo PixiJS:** `src/pixi/**` com `createBoardRenderer`, layers fixos e fallbacks vetoriais para sprites ausentes.
- [x] **Asset Pipeline:** manifesto e documentação em `public/assets` garantindo que cada sprite/efeito possua alias rastreável.
- [x] **Realtime UI:** canal de sincronização (polling -> Socket.io) integrado ao store, mantendo o board alinhado com o backend e preparado para troca por websockets assim que o passo 2 estiver pronto.
- [x] **Acessibilidade & UX:** aria-live para eventos críticos, overlay textual sempre sincronizado, botões de controle e mensagens claras quando sprites ou ações estiverem indisponíveis.

### 4. Preparação para Regras Khalistra

- [ ] **Contratos Extensíveis:** garantir que `GameStateSnapshot`, eventos e DTOs comportem atributos extras (cartas, mana, estados) sem breaking changes.
- [ ] **Sistema de Modificadores:** criar esqueleto em `@khalistra/game-engine` para aplicar efeitos (buff/debuff) mesmo que desativado na V1.
- [ ] **Catálogo de Ritual Cards:** definir schema base (nome, custo, alvo, duração) em `docs/mechs` e refletir tipos compartilhados.
- [ ] **Documentação Técnica:** atualizar README/AGENTS com instruções de como ativar novas regras via feature flags para futuras iterações.

---

**Critérios de Saída da Fase 1**

1. Partida clássica pode ser iniciada, pausada e retomada com os mesmos jogadores via backend persistido.
2. Todo movimento é enviado/recebido via Socket.io, com frontend respondendo em tempo real e logs disponíveis para troubleshooting.
3. A arquitetura expõe pontos de extensão claros para cartas/rituais (tipos, eventos, armazenamento) sem exigir refatorações profundas.
