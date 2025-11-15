## ROADMAP — Rumo ao Lançamento na Steam

**Objetivo Final:** Desenvolver Khalistra como um jogo desktop profissional para lançamento na Steam, começando com um protótipo clássico (regras básicas inspiradas no xadrez) com engine, backend e frontend integrados, garantindo persistência e telemetria suficientes para evoluir para as regras exclusivas de Khalistra.

**Visão de Produto:** Um jogo de estratégia em tempo real com aparência e funcionalidades de jogo desktop premium, não web game. Interface nativa, menus profissionais, sistema de salas privadas e futuramente matchmaking ranqueado.

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

### 4. Interface Desktop & Sistema de Salas

- [x] **Menu Principal Nativo:** criar interface inicial profissional com opções "Criar Partida", "Entrar em Partida", "Configurações" e "Sair".
- [x] **Sistema de Código de Sala:** implementar geração de códigos únicos de 6-8 caracteres para criação de salas privadas.
- [x] **Fluxo Host/Cliente:** 
  - Host cria sala e recebe código
  - Cliente insere código e entra na sala
  - Validação e feedback visual para códigos inválidos/expirados
- [x] **Lobby de Espera:** tela intermediária mostrando jogadores conectados antes do início da partida.
- [x] **Aparência Desktop:** remover todos os elementos "web-like", aplicar temas escuros/profissionais, tipografia gaming.

### 5. Preparação para Regras Khalistra

- [ ] **Contratos Extensíveis:** garantir que `GameStateSnapshot`, eventos e DTOs comportem atributos extras (cartas, mana, estados) sem breaking changes.
- [ ] **Sistema de Modificadores:** criar esqueleto em `@khalistra/game-engine` para aplicar efeitos (buff/debuff) mesmo que desativado na V1.
- [ ] **Catálogo de Ritual Cards:** definir schema base (nome, custo, alvo, duração) em `docs/mechs` e refletir tipos compartilhados.
- [ ] **Documentação Técnica:** atualizar README/AGENTS com instruções de como ativar novas regras via feature flags para futuras iterações.

---

---

### 6. Infraestrutura Steam & Distribuição

- [ ] **Electron Desktop Wrapper:** 
  - Configurar Electron para empacotar o Next.js como aplicação desktop nativa
  - Implementar main process com BrowserWindow customizada (1280x720, sem frame padrão)
  - Configurar preload script para comunicação segura entre renderer e main process
  - Integrar electron-builder para gerar executáveis Windows (.exe), Mac (.dmg) e Linux (.AppImage)
- [ ] **Steam SDK Integration:** 
  - Integrar Steamworks.js ou greenworks para comunicação com Steam API
  - Implementar achievements, leaderboards e estatísticas através de IPC handlers
  - Configurar Steam overlay compatibility e external link handling
- [ ] **Auto-updater:** 
  - Implementar electron-updater para atualizações automáticas pós-lançamento
  - Configurar update server e assinatura digital para builds de produção
- [ ] **Analytics & Telemetria:** 
  - Instrumentar métricas de jogo (tempo de partida, abandono, crashes)
  - Implementar telemetria específica para desktop (performance, hardware specs)
- [ ] **Build Pipeline Steam-Ready:** 
  - CI/CD automatizado para gerar builds multiplataforma
  - Configuração electron-builder.steam.js com metadados Steam
  - Scripts de empacotamento com redistribuíveis necessários (Visual C++)

---

### FASES FUTURAS (Pós-V1)

### 7. Matchmaking & Sistema Ranqueado

- [ ] **Fila de Matchmaking:** sistema de busca de partida baseado em rating/MMR.
- [ ] **Sistema de Rating:** ELO ou similar para matchmaking balanceado.
- [ ] **Seasons & Leaderboards:** competições temporárias e rankings globais.
- [ ] **Anti-cheat Básico:** validações server-side e detecção de comportamentos suspeitos.

### 8. Monetização & Conteúdo

- [ ] **Battle Pass/Season Pass:** sistema de progressão com recompensas.
- [ ] **Skins & Customização:** peças e tabuleiros alternativos.
- [ ] **DLCs de Expansão:** novos modos de jogo e mecânicas avançadas.

---

**Critérios de Saída da Fase 1 (Versão Steam Early Access)**

1. Menu principal profissional com navegação fluida e aparência desktop nativa.
2. Sistema completo de criar/entrar em salas via código funcional e estável.
3. Partida clássica pode ser iniciada, pausada e retomada com os mesmos jogadores via backend persistido.
4. Todo movimento é enviado/recebido via Socket.io, com frontend respondendo em tempo real.
5. Build desktop empacotado e pronto para distribuição Steam.
6. Documentação completa para desenvolvedores e sistema de feature flags para futuras expansões.
