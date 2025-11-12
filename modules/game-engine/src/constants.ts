import type { PieceBlueprint, PieceType } from './types';

export const BOARD_SIZE = 8;

export const BACK_RANK: PieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook'
];

export const PROMOTION_OPTIONS: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
export const DEFAULT_PROMOTION: PieceType = 'queen';

export const PIECE_LIBRARY: Record<PieceType, PieceBlueprint> = {
  king: { type: 'king', label: 'Rei' },
  queen: { type: 'queen', label: 'Rainha' },
  rook: { type: 'rook', label: 'Torre' },
  bishop: { type: 'bishop', label: 'Bispo' },
  knight: { type: 'knight', label: 'Cavalo' },
  pawn: { type: 'pawn', label: 'Peão' }
};

export const buildPieceId = (playerId: string, pieceType: PieceType, index: number) =>
  `${playerId}.${pieceType}.${index}`;
