import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
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

  const sprite = new Container();
  sprite.eventMode = 'static';
  sprite.cursor = 'pointer';
  const targetSize = TILE_SIZE * 0.9;

  try {
    const texture = await Assets.load(alias);
    const node = new Sprite(texture);
    node.anchor.set(0.5);
    node.width = targetSize;
    node.height = targetSize;
    sprite.addChild(node);
  } catch {
    const placeholder = new Graphics()
      .rect(-targetSize / 2, -targetSize / 2, targetSize, targetSize)
      .fill({ color: 0x888888 })
      .stroke({ color: BOARD_THEME.border, width: 2 });
    sprite.addChild(placeholder);
  }

  return sprite;
};
