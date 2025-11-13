import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import type { PieceState } from '@khalistra/game-engine';
import { BOARD_THEME, PIECE_COLORS, TILE_SIZE } from '../constants';
import { ensureDefaultAssets, getPieceAlias } from './manifest';

const PIECE_LABEL_MAP: Record<PieceState['type'], string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: 'P'
};

const buildVectorFallback = (colorKey: 'light' | 'shadow', type: PieceState['type']) => {
  const wrapper = new Container();
  const base = new Graphics()
    .circle(0, 0, (TILE_SIZE * 0.6) / 2)
    .fill({ color: PIECE_COLORS[colorKey] })
    .stroke({ color: BOARD_THEME.border, width: 2 });

  const glyph = new Text({
    text: PIECE_LABEL_MAP[type],
    style: {
      fill: '#0f090d',
      fontFamily: 'Inter, "Segoe UI", Helvetica, sans-serif',
      fontSize: TILE_SIZE * 0.35,
      fontWeight: '700'
    }
  });
  glyph.anchor.set(0.5);

  wrapper.addChild(base, glyph);
  return wrapper;
};

export const createPieceContainer = (piece: PieceState, colorKey: 'light' | 'shadow', setId = 'default') => {
  ensureDefaultAssets();
  const alias = getPieceAlias(setId, colorKey, piece.type);
  const container = new Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';
  container.hitArea = null;

  const fallback = buildVectorFallback(colorKey, piece.type);
  container.addChild(fallback);

  const loadTexture = async () => {
    try {
      const texture = await Assets.load(alias);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      const targetSize = TILE_SIZE * 0.85;
      sprite.width = targetSize;
      sprite.height = targetSize;

      container.removeChild(fallback);
      fallback.destroy({ children: true });
      container.addChild(sprite);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[PixiBoard] Sprite ausente para ${alias}. Usando placeholder.`, error);
      }
    }
  };

  void loadTexture();

  return container;
};
