import type { PieceBlueprint, PieceType } from './types';

export const BOARD_SIZE = 5;
export const STARTING_RANK: PieceType[] = ['sentinel', 'oracle', 'dancer', 'oracle', 'sentinel'];

export const PIECE_LIBRARY: Record<PieceType, PieceBlueprint> = {
  sentinel: { type: 'sentinel', maxRange: 1 },
  oracle: { type: 'oracle', maxRange: 2 },
  dancer: { type: 'dancer', maxRange: 3 }
};

export const ritualVictoryTargets: PieceType[] = ['dancer'];

export const buildPieceId = (playerId: string, pieceType: PieceType, index: number) =>
  `${playerId}.${pieceType}.${index}`;
