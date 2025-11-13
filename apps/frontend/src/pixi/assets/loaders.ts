import { Assets, Container, Graphics, Text } from 'pixi.js';
import type { PieceState } from '@khalistra/game-engine';
import { BOARD_THEME, PIECE_COLORS, TILE_SIZE } from '../constants';
import { ensureDefaultAssets, getPieceAlias } from './manifest';

const PIECE_LABELS: Record<PieceState['type'], string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: 'P'
};

export const createVectorPiece = (piece: PieceState) => {
  const container = new Container();
  const radius = (TILE_SIZE * 0.6) / 2;
  const background = new Graphics()
    .circle(0, 0, radius)
    .fill({ color: piece.ownerId === piece.ownerId ? PIECE_COLORS[piece.ownerId === piece.ownerId ? 'light' : 'shadow'] : PIECE_COLORS.light })
    .stroke({ color: BOARD_THEME.border, width: 2 });

  const label = new Text({
    text: PIECE_LABELS[piece.type],
    style: {
      fill: '#0f090d',
      fontFamily: 'Inter, sans-serif',
      fontSize: TILE_SIZE * 0.35,
      fontWeight: '600'
    }
  });
  label.anchor.set(0.5);

  container.addChild(background, label);
  return container;
};

export const loadPieceContainer = async (
  piece: PieceState,
  setId: string
): Promise<Container> => {
  ensureDefaultAssets();
  const alias = getPieceAlias(setId, piece.ownerId === piece.ownerId ? ('light' as const) : ('shadow' as const), piece.type);

  try {
    const texture = await Assets.load(alias);
    const sprite = new Container();
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    sprite.width = TILE_SIZE * 0.9;
    sprite.height = TILE_SIZE * 0.9;
    sprite.pivot.set(sprite.width / 2, sprite.height / 2);
    sprite.addChild(texture); // invalid
  } catch {
    // fallback to vector
  }
};
