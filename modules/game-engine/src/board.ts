import type { GameStateSnapshot, PieceState, PlayerId, Vector2 } from './types';

export const isSamePosition = (a: Vector2, b: Vector2) => a.x === b.x && a.y === b.y;

export const isWithinBoard = (position: Vector2, boardSize: number) =>
  position.x >= 0 &&
  position.y >= 0 &&
  position.x < boardSize &&
  position.y < boardSize;

export const findPieceById = (pieces: PieceState[], pieceId: string) =>
  pieces.find((piece) => piece.id === pieceId);

export const findPieceAt = (pieces: PieceState[], target: Vector2) =>
  pieces.find((piece) => isSamePosition(piece.position, target));

export const getOpponent = (players: [PlayerId, PlayerId], current: PlayerId) =>
  players[0] === current ? players[1] : players[0];

export const clonePieces = (pieces: PieceState[]) => pieces.map((piece) => ({ ...piece }));

export const replacePiece = (pieces: PieceState[], updated: PieceState): PieceState[] =>
  pieces.map((piece) => (piece.id === updated.id ? updated : piece));

export const removePiece = (pieces: PieceState[], targetId: string | undefined): PieceState[] =>
  targetId ? pieces.filter((piece) => piece.id !== targetId) : pieces;

export const findKing = (state: GameStateSnapshot, playerId: PlayerId): PieceState => {
  const king = state.pieces.find((piece) => piece.ownerId === playerId && piece.type === 'king');
  if (!king) {
    throw new Error(`Rei não encontrado para o jogador ${playerId}`);
  }
  return king;
};
