import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import type { GameStateSnapshot, LegalMove, PieceState } from '@khalistra/game-engine';
import { BOARD_THEME, TILE_SIZE } from '../constants';
import type { PixiBoardOptions, PixiBoardRenderer, PixiBoardSyncPayload } from '../types';
import { createPieceContainer } from '../assets/piece';

interface InternalState {
  app: Application;
  root: Container;
  boardLayer: Container;
  highlightsLayer: Container;
  piecesLayer: Container;
  lastMoveLayer: Container;
  statusLayer: Container;
  pieceNodes: Map<string, Container>;
  currentState?: GameStateSnapshot;
  selectedPieceId?: string;
  legalMoves: LegalMove[];
  disabled: boolean;
  callbacks: PixiBoardOptions;
}

const tileKey = (x: number, y: number) => `${x}-${y}`;

const getColorKey = (state: GameStateSnapshot, piece: PieceState): 'light' | 'shadow' =>
  (state.players[0] === piece.ownerId ? 'light' : 'shadow');

const drawBoard = (layer: Container, boardSize: number) => {
  layer.removeChildren();
  const graphics = new Graphics();
  graphics.rect(0, 0, boardSize * TILE_SIZE, boardSize * TILE_SIZE).fill({ color: BOARD_THEME.border });

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const isDark = (x + y) % 2 === 1;
      graphics
        .rect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        .fill({ color: isDark ? BOARD_THEME.dark : BOARD_THEME.light });
    }
  }

  layer.addChild(graphics);
};

const drawLegalMoves = (layer: Container, moves: LegalMove[], selected: string | undefined) => {
  layer.removeChildren();
  if (!moves.length || !selected) {
    return;
  }

  const graphics = new Graphics();
  moves.forEach((move) => {
    const centerX = move.to.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = move.to.y * TILE_SIZE + TILE_SIZE / 2;

    if (move.capture) {
      graphics.circle(centerX, centerY, TILE_SIZE * 0.35).stroke({ color: BOARD_THEME.capture, width: 4 });
    } else {
      graphics.circle(centerX, centerY, TILE_SIZE * 0.18).fill({ color: BOARD_THEME.highlight, alpha: 0.5 });
    }
  });

  layer.addChild(graphics);
};

const drawLastMove = (layer: Container, state?: GameStateSnapshot) => {
  layer.removeChildren();
  const lastMove = state?.history.at(-1);
  if (!lastMove) {
    return;
  }

  const highlight = new Graphics();
  [lastMove.from, lastMove.to].forEach((pos) => {
    highlight
      .rect(pos.x * TILE_SIZE + 2, pos.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      .fill({ color: BOARD_THEME.lastMove });
  });

  layer.addChild(highlight);
};

const drawCheckIndicator = (layer: Container, state?: GameStateSnapshot) => {
  layer.removeChildren();
  if (!state?.checkedPlayerId) {
    return;
  }

  const king = state.pieces.find(
    (piece) => piece.ownerId === state.checkedPlayerId && piece.type === 'king'
  );

  if (!king) {
    return;
  }

  const indicator = new Graphics()
    .rect(king.position.x * TILE_SIZE + 6, king.position.y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12)
    .stroke({ color: BOARD_THEME.check, width: 4 });

  layer.addChild(indicator);
};

const syncPieces = async (ctx: InternalState, state: GameStateSnapshot) => {
  const { piecesLayer, pieceNodes } = ctx;
  const nextIds = new Set(state.pieces.map((piece) => piece.id));

  // remove capturados
  pieceNodes.forEach((node, id) => {
    if (!nextIds.has(id)) {
      node.removeFromParent();
      node.destroy({ children: true });
      pieceNodes.delete(id);
    }
  });

  for (const piece of state.pieces) {
    let node = pieceNodes.get(piece.id);
    const colorKey = getColorKey(state, piece);

    if (!node) {
      node = createPieceContainer(piece, colorKey);
      node.on('pointertap', (event) => {
        event.stopPropagation();
        if (ctx.disabled) {
          return;
        }
        ctx.selectedPieceId = piece.id;
        ctx.callbacks.onSelectPiece(piece.id);
      });
      pieceNodes.set(piece.id, node);
      piecesLayer.addChild(node);
    }

    node.position.set(piece.position.x * TILE_SIZE + TILE_SIZE / 2, piece.position.y * TILE_SIZE + TILE_SIZE / 2);
    node.eventMode = ctx.disabled ? 'none' : 'static';
  }
};

const getTileFromPointer = (state: GameStateSnapshot, globalX: number, globalY: number) => {
  const boardSize = state.boardSize;
  const x = Math.floor(globalX / TILE_SIZE);
  const y = Math.floor(globalY / TILE_SIZE);
  if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
    return undefined;
  }
  return { x, y };
};

export const createBoardRenderer = async (
  options: PixiBoardOptions
): Promise<PixiBoardRenderer> => {
  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    preference: 'webgpu',
    hello: process.env.NODE_ENV !== 'production',
    resizeTo: options.container
  });

  options.container.appendChild(app.canvas);

  const boardLayer = new Container();
  const highlightsLayer = new Container();
  const piecesLayer = new Container();
  const lastMoveLayer = new Container();
  const statusLayer = new Container();

  app.stage.eventMode = 'static';
  app.stage.hitArea = new Rectangle(0, 0, TILE_SIZE * 8, TILE_SIZE * 8);
  app.stage.addChild(boardLayer, highlightsLayer, piecesLayer, lastMoveLayer, statusLayer);

  const ctx: InternalState = {
    app,
    root: app.stage,
    boardLayer,
    highlightsLayer,
    piecesLayer,
    lastMoveLayer,
    statusLayer,
    pieceNodes: new Map(),
    legalMoves: [],
    disabled: Boolean(options.disabled),
    callbacks: options
  };

  app.stage.on('pointertap', (event) => {
    if (ctx.disabled || !ctx.currentState) {
      options.onSelectPiece(undefined);
      return;
    }

    const tile = getTileFromPointer(ctx.currentState, event.globalX, event.globalY);
    if (!tile) {
      options.onSelectPiece(undefined);
      return;
    }

    const key = tileKey(tile.x, tile.y);
    const occupant = ctx.currentState.pieces.find((piece) => tileKey(piece.position.x, piece.position.y) === key);

    if (ctx.selectedPieceId) {
      const move = ctx.legalMoves.find(
        (candidate) => candidate.to.x === tile.x && candidate.to.y === tile.y
      );
      if (move) {
        options.onSubmitMove(ctx.selectedPieceId, move.to);
        return;
      }
    }

    if (occupant && occupant.ownerId === ctx.currentState.activePlayer && !ctx.disabled) {
      ctx.selectedPieceId = occupant.id;
      options.onSelectPiece(occupant.id);
      return;
    }

    options.onSelectPiece(undefined);
  });

  const sync = (payload: PixiBoardSyncPayload) => {
    ctx.currentState = payload.state;
    ctx.selectedPieceId = payload.selectedPieceId;
    ctx.legalMoves = payload.legalMoves;
    ctx.disabled = Boolean(payload.disabled);

    if (!payload.state) {
      return;
    }

    drawBoard(boardLayer, payload.state.boardSize);
    void syncPieces(ctx, payload.state);
    drawLegalMoves(highlightsLayer, payload.legalMoves, payload.selectedPieceId);
    drawLastMove(ctx.lastMoveLayer, payload.state);
    drawCheckIndicator(ctx.statusLayer, payload.state);
  };

  const destroy = () => {
    app.destroy(true, { children: true });
  };

  return { sync, destroy };
};
