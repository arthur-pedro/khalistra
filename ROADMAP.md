## ROADMAP — Primeira Parcela Jogável

**Objetivo:** consolidar o protótipo clássico (regras básicas inspiradas no xadrez) com engine, backend e frontend integrados, garantindo persistência e telemetria suficientes para destravar as regras exclusivas de Khalistra sem refatorações estruturais.

> Sempre alinhar este roadmap com `docs/AGENTS.md` e `docs/mechs/**` antes de iniciar qualquer item.

---

### 1. Estado Persistido & Sessões

- [ ] **Migrations + Seeds:** modelar jogadores, partidas, movimentos e snapshots em PostgreSQL usando Prisma (ou equivalente) com seeds mínimos para testes locais.
- [ ] **Hydratação via Redis:** ao receber `game:start`, carregar o snapshot clássico do banco e manter o estado volátil no Redis para permitir reconexões rápidas.
- [ ] **Reidratação automática:** sempre que o backend reiniciar, restaurar partidas em andamento combinando PostgreSQL (histórico) + Redis (estado atual).

### 2. Canal Realtime Completo

- [ ] **Handshake Socket.io:** implementar fluxo `game:join -> game:move -> game:update -> game:finish`, sincronizando com o módulo matches existente.
- [ ] **Ack + Erros padronizados:** cada evento deve ter confirmação ou erro tipado baseado em `@khalistra/shared/types`.
- [ ] **Replay sob demanda:** permitir que novos clientes obtenham o snapshot mais recente ao assinar o canal da partida.

### 3. Frontend Arena Ritual

- [ ] **Client State Store:** mover o estado da partida para Zustand/Jotai para habilitar múltiplos componentes consumindo o mesmo snapshot (tabuleiro, log, HUD, painel de status).
- [ ] **Realtime UI:** conectar-se ao Socket.io, manter otimismo nas jogadas e refletir `checkedPlayerId`, resoluções e desconexões.
- [ ] **Acessibilidade & UX:** atalhos de teclado, destaques de xeque, replays rápidos e log com filtros (capturas, promoções, xeque-mate).

### 4. Observabilidade & QA

- [ ] **Logs Estruturados Unificados:** padronizar `logStructuredEvent` para incluir trace-id, player-id e resultado do movimento tanto no HTTP quanto no Socket.
- [ ] **Telemetria Básica:** expor métricas (turnos/partida, duração média, vitórias por cor) via Prometheus e dashboards Grafana mínimos.
- [ ] **Testes End-to-End:** ampliar Jest E2E ou Playwright para cobrir fluxo completo (criar partida, múltiplos movimentos, finalização e reconexão).

### 5. Preparação para Regras Khalistra

- [ ] **Contratos Extensíveis:** garantir que `GameStateSnapshot`, eventos e DTOs comportem atributos extras (cartas, mana, estados) sem breaking changes.
- [ ] **Sistema de Modificadores:** criar esqueleto em `@khalistra/game-engine` para aplicar efeitos (buff/debuff) mesmo que desativado na V1.
- [ ] **Catálogo de Ritual Cards:** definir schema base (nome, custo, alvo, duração) em `docs/mechs` e refletir tipos compartilhados.
- [ ] **Documentação Técnica:** atualizar README/AGENTS com instruções de como ativar novas regras via feature flags para futuras iterações.

---

**Critérios de Saída da Fase 1**

1. Partida clássica pode ser iniciada, pausada e retomada com os mesmos jogadores via backend persistido.
2. Todo movimento é enviado/recebido via Socket.io, com frontend respondendo em tempo real e logs disponíveis para troubleshooting.
3. A arquitetura expõe pontos de extensão claros para cartas/rituais (tipos, eventos, armazenamento) sem exigir refatorações profundas.
