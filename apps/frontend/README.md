# @khalistra/frontend — PixiJS Integration Guide

Interface oficial do Khalistra construída em Next.js 16 + React 19 e preparada para renderizar o tabuleiro, sprites e HUD via [PixiJS 8](https://pixijs.com/8.x/guides/getting-started/intro). Este guia resume como iniciar o canvas, organizar assets e manter o jogo resiliente enquanto os sprites definitivos chegam.

## 1. Setup Rápido

```bash
pnpm install
pnpm dev # http://localhost:3000
```

Variáveis úteis (arquivo `.env.local` na raiz do app):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_PIXI_DEBUG=true # habilita overlays e bounds helpers
```

> Sempre rode `pnpm lint`, `pnpm test` e `pnpm build` na raiz do monorepo antes do PR, conforme `AGENTS.md` global.

## 2. Inicializando o PixiJS Stage

1. **Importação dinâmica:** use `useEffect` ou componentes `"use client"` para inicializar o Pixi apenas no browser (vide `src/components/board.tsx`).
2. **Aplicação:**
   ```ts
   const app = await Pixi.Application.init({
     backgroundAlpha: 0,
     preference: 'webgpu',
     resizeTo: containerRef.current,
   });
   containerRef.current.appendChild(app.canvas);
   ```
3. **Layers obrigatórios:**
   - `boardLayer` (casas, grid, destaques base)
   - `piecesLayer` (sprites das peças, sombras)
   - `effectsLayer` (poderes, animações temporárias)
   - `hudLayer` (marcadores de seleção, status, tooltips)

4. **Ticker:** use `app.ticker.add` para animações leves; preferir GSAP/Timeline somente para sequências complexas.

### Estrutura do Módulo

- `src/pixi/constants.ts`: tamanhos, tema e cores padrão.
- `src/pixi/assets/manifest.ts`: registra aliases e caminhos em `public/assets`.
- `src/pixi/assets/piece.ts`: monta container de peça (textura real ou fallback vetorial).
- `src/pixi/factories/createBoardRenderer.ts`: cria o `Application`, layers, highlights e eventos.
- `src/pixi/hooks/usePixiBoard.ts`: integra o renderer com React.

## 3. Convenções de Assets

Todos os assets ficam em `apps/frontend/public/assets` seguindo esta hierarquia:

```
public/assets/
  boards/<boardId>/atlas.json
  pieces/<setId>/<pieceName>.png
  effects/<effectId>/sprite-sheet.json
  ui/icons/<icon>.svg
```

### 3.1 Board Skins
- **Arquivo obrigatório:** `public/assets/boards/<boardId>/atlas.json` + texturas (`.png` ou `.webp`).
- **Fallback:** se `boardId` não existir, usar `boards/default`. Nunca quebrar; logue um warning (`console.warn('[PixiBoard] skin missing, using default')`).
- **Metadados recomendados:**
  ```json
  {
    "id": "obsidian",
    "tileSize": 96,
    "gridColor": "#d2a548",
    "highlightColor": "rgba(245,200,116,0.35)"
  }
  ```

### 3.2 Peças
- Nome do arquivo: `<color>-<piece>.png` (ex.: `light-queen.png`).
- Mantenha centro geométrico alinhado à base (usar guides 96×96).
- **Fallback:** se um sprite faltar, renderizar `pieces/default/<color>-<piece>.png`; se ainda ausente, usar um `Graphics().circle()` com cor sólida.

### 3.3 Efeitos / Poderes
- Guardar spritesheets em `effects/<ritual>/sheet.json` seguindo formato Pixi Assets.
- Registrar animações pelo `Assets.add({ alias, src })` antes do load.
- Toda animação precisa de `duration` e `cleanup` (auto-destruir container ao finalizar).
- Se o efeito não existir, exibir apenas um glow genérico e seguir o fluxo lógico (nunca bloquear turno).

### 3.4 HUD & UI
- Ícones e ornamentos em SVG (`public/assets/ui/icons`).
- Preferir CSS para textos; Pixi Text apenas quando necessário (ex.: contadores dentro do canvas).

## 4. Workflow de Assets

1. Adicione o arquivo em `public/assets/...`.
2. Declare o asset no registro central (`src/pixi/assets/manifest.ts`).
3. Use `await Assets.load(alias)` antes de instanciar o sprite.
4. Sempre encapsule o acesso em helpers:
   ```ts
   export const getPieceTexture = async (setId: string, color: 'light'|'shadow', piece: string) => {
     const alias = `pieces/${setId}/${color}-${piece}`;
     try {
       return await Assets.load(alias);
     } catch {
       return Assets.load(`pieces/default/${color}-${piece}`);
     }
   };
   ```

## 5. Eventos e Interação

- **Seleção:** traduzir cliques do Pixi (`pointertap`) para coordenadas do tabuleiro e delegar ao estado React/Zustand.
- **Movimento:** anime a peça em ~200 ms seguindo easing `quartOut`, aplicar `zIndex` temporário acima dos demais.
- **Estados (buff/debuff):** usar `effectsLayer` com filtros (`OutlineFilter`, `GlowFilter`) configurados por cor.
- **Logs:** sempre registrar `matchId`, `pieceId`, `assetId` quando houver fallback.

## 6. Boas Práticas Gerais

- Renderização determinística: não animar enquanto o backend não confirmar o movimento (ou usar otimismo com rollback visual).
- Responsividade: `resizeTo` deve acompanhar o container; exponha `scaleFactor` para HUD saber o tamanho real das casas.
- Testes: componha helpers Pixi em módulos puros e cubra com Jest (ex.: função que monta o manifest, calculadora de coordenadas).
- Limpeza: remova listeners no `useEffect` (`return () => app.destroy(true)`), evitando vazamentos ao navegar entre páginas.

## 7. Scripts

| Script | Ação |
| --- | --- |
| `pnpm dev` | Dev server Next.js |
| `pnpm lint` | ESLint (React + Pixi hooks) |
| `pnpm test` | Jest (usa jsdom + mocks das texturas) |
| `pnpm build` | Next build + bundle compartilhado |

## 8. Estado Global & Realtime

- `src/state/match-store.ts`: estado centralizado via Zustand, responsável por spawnar partidas, aplicar snapshots, selecionar peças e expor `legalMoves` sempre consistentes com o motor.
- `src/lib/realtime/match-channel.ts`: cliente Socket.io responsável por handshake `game:join`, replay sob demanda e submissão de movimentos com ACK padronizado.
- `src/lib/realtime/useMatchChannel.ts`: hook que habilita/desabilita o canal conforme o status da partida, renovando snapshots automaticamente em reconexões.
- Componentes devem consumir dados somente via `useMatchStore` para evitar duplicar lógica de seleção ou regras.

---

## 9. Cenas do Frontend

O frontend agora é estruturado em **cenas** sob `src/scenes/`, evitando qualquer camada de “site” separada do jogo. Cada cena encapsula seu próprio layout e interações:

- `MainMenuScene`: ponto de entrada do cliente, responsável por iniciar treino rápido (`spawnMatch`) ou navegar para formulários de sala.
- `CreateRoomScene` / `JoinRoomScene`: formulários dedicados para gerar ou ingressar em lobbies, usando apenas estado do `room-store`.
- `LobbyScene`: sala de espera que mostra slots de anfitrião/convidado, countdown (`useCountdown`) e botão de start (host chama `startMatch` e injeta o snapshot no `match-store`).
- `MatchScene`: integra o `MatchBoard` (PixiJS) e o HUD com histórico, status e players. Todo o controle de peças continua vindo do `match-store`.
- `SettingsOverlay`: painel modal que guarda preferências locais de HUD. Não existe outra tela “de site” além dessas cenas.

Sempre adicione novas cenas dentro de `src/scenes/` e exponha-as via `src/scenes/index.ts` para manter a organização consistente.

## 10. Checklist de Assets consumidos

As cenas dependem dos mesmos manifests Pixi documentados anteriormente, mas agora o fluxo completo do jogo ocorre imediatamente ao abrir o app. Garanta que os assets abaixo existam (com fallbacks já implementados):

- `public/assets/boards/default/atlas.json`: skin padrão do tabuleiro (`MatchBoard` cai para este atlas quando a skin solicitada não existe).
- `public/assets/pieces/default/<color>-<piece>.png`: sprites base de cada peça. Ausências caem para vetores do `piece.ts`.
- `public/assets/effects/`: manifeste os efeitos ativos aqui; se um efeito solicitado não existir, a HUD usa glow genérico automaticamente.
- `public/assets/ui/icons/`: ícones e ornamentos da HUD. Ausências são substituídas por chip textual para manter a UI acessível.

Documente qualquer novo asset adicionado e sempre mantenha o fallback para que o jogo continue funcional mesmo sem sprites específicos.

Revisitar este README sempre que novos tipos de assets forem introduzidos (cartas, rituais, partículas) para manter o pipeline padronizado.
