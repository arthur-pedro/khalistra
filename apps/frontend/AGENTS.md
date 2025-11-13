# Diretrizes de Agentes — Frontend Khalistra

Este documento orienta qualquer pessoa (ou agente automatizado) que contribua na interface Next.js + PixiJS do Khalistra. Siga também `../../AGENTS.md` e o conteúdo em `docs/` antes de iniciar novas tarefas.

## Stack & Dependências

- **Framework:** Next.js 16 (App Router, React 19, componentes Client).
- **Renderização do tabuleiro:** PixiJS 8 (`@pixi/app`, `@pixi/graphics`, `@pixi/assets`).
- **Estado:** a curto prazo, hooks locais; transicionar para Zustand/Jotai conforme roadmap.
- **Tipos compartilhados:** reutilize tudo de `@khalistra/game-engine` e `@khalistra/shared`.

## Boas Práticas PixiJS

1. **Inicialização apenas no client:** encapsule cada canvas em componentes `"use client"` e cheque `typeof window !== 'undefined'` antes de tocar em APIs DOM.
2. **Camadas:** mantenha containers fixos (`boardLayer`, `piecesLayer`, `effectsLayer`, `hudLayer`). Inserir sprites diretamente no layer correto evita z-order caótico.
3. **Assets obrigatórios:** quaisquer loads devem passar pelos helpers de manifesto (em `src/pixi/assets`). Nunca invoque `Assets.load` com caminhos literais no componente.
4. **Fallbacks:** se o asset solicitado não existir, renderize o *default* descrito no README e registre um warning descritivo contendo `matchId`, `assetId` e `pieceId`. O jogo **nunca** deve quebrar por ausência de sprite.
5. **Eventos:** trate `pointertap`, `pointerdown`, `pointerup` e `pointerover` delegando para camada de estado. Nada de regras de jogo dentro dos handlers Pixi.
6. **Cleanup:** toda criação de `Application` precisa de `app.destroy(true)` e remoção do canvas do DOM no `useEffect` de limpeza para evitar vazamentos.

## Organização de Código

- `src/components/`: componentes React “puros”, sem Pixi.
- `src/pixi/`: helpers, manifests, fábricas de containers (`assets/`, `factories/`, `hooks/`).
- `public/assets/`: único local de sprites, com subpastas `boards/`, `pieces/`, `effects/`, `ui/`.
- `src/lib/api.ts`: mantém chamadas ao backend; qualquer stream realtime futuro vive em `src/lib/realtime`.
- `src/state/`: stores Zustand (ex.: `match-store`) que concentram snapshots, seleção e submissão de jogadas.
- `src/lib/realtime/`: canal/polling que será trocado por Socket.io assim que o backend estiver pronto.

### Estrutura `src/pixi`

- `constants.ts`: tamanhos e cores padrão do tabuleiro.
- `assets/manifest.ts`: registra aliases + paths esperados para sprites (mesmo que ainda não existam).
- `assets/piece.ts`: constrói containers das peças, carregando texturas quando disponíveis e caindo para vetores.
- `factories/createBoardRenderer.ts`: inicializa `Application`, camadas, eventos e sincroniza estado do jogo.
- `hooks/usePixiBoard.ts`: integra o renderer com React, cuidando de lifecycle e sincronização.

## Adição de Assets

1. Coloque os arquivos em `public/assets/...` seguindo o padrão descrito no README.
2. Atualize o manifest (`src/pixi/assets/manifest.ts`) com alias estáveis (`pieces/default/light-queen`).
3. Crie um helper `loadXYZTexture` que centralize fallback e logging.
4. Acrescente testes unitários para o helper (mockando `@pixi/assets`).

## UX e Resiliência

- Interface deve permanecer funcional mesmo sem sprites, efeitos ou ícones adicionais.
- Sempre ofereça feedback visual/textual quando um recurso gráfico estiver indisponível (ex.: placeholder com cor sólida + tooltip “sprite em produção”).
- Estados críticos (xeque, movimentos disponíveis) devem continuar refletidos no DOM/React para acessibilidade, independentemente do canvas.

## Checklist por PR

- [ ] Assets novos documentados no README e registrados no manifest.
- [ ] Fallback visual/estrutural implementado (sem throws).
- [ ] Testes e lint (`pnpm lint && pnpm test`) executados localmente.
- [ ] Canvas destruído corretamente e sem listeners órfãos.
- [ ] Logs de warnings usam `logStructuredEvent` quando fizer sentido (ex.: asset ausente recorrente).

Seguir estas diretrizes garante que o frontend permaneça confiável enquanto evoluímos para o visual completo do Khalistra.
