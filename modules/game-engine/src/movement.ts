import { DEFAULT_PROMOTION } from './constants';
import { findPieceAt, isWithinBoard } from './board';
import type { GameStateSnapshot, LegalMove, PieceState, PlayerId, Vector2 } from './types';

const ORTHOGONAL_DIRECTIONS: Vector2[] = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 }
];

const DIAGONAL_DIRECTIONS: Vector2[] = [
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 }
];

const KNIGHT_VECTORS: Vector2[] = [
  { x: 1, y: 2 },
  { x: 2, y: 1 },
  { x: -1, y: 2 },
  { x: -2, y: 1 },
  { x: 1, y: -2 },
  { x: 2, y: -1 },
  { x: -1, y: -2 },
  { x: -2, y: -1 }
];

const KING_DIRECTIONS: Vector2[] = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

export type MovementIntent = 'move' | 'attack';

interface MovementContext {
  state: GameStateSnapshot;
  piece: PieceState;
  intent: MovementIntent;
}

const addVector = (origin: Vector2, delta: Vector2): Vector2 => ({
  x: origin.x + delta.x,
  y: origin.y + delta.y
});

export const getPlayerDirection = (players: [PlayerId, PlayerId], ownerId: PlayerId): 1 | -1 =>
  players[0] === ownerId ? 1 : -1;

const generateRayMoves = (
  { state, piece }: MovementContext,
  directions: Vector2[],
  maxSteps?: number
): LegalMove[] => {
  const moves: LegalMove[] = [];

  directions.forEach((direction) => {
    let steps = 0;
    let target = addVector(piece.position, direction);

    while (isWithinBoard(target, state.boardSize)) {
      steps += 1;
      const occupant = findPieceAt(state.pieces, target);

      if (occupant && occupant.ownerId === piece.ownerId) {
        break;
      }

      moves.push({ to: target, capture: Boolean(occupant) });

      if (occupant) {
        break;
      }

      if (maxSteps && steps >= maxSteps) {
        break;
      }

      target = addVector(target, direction);
    }
  });

  return moves;
};

const generateKnightMoves = ({ state, piece }: MovementContext): LegalMove[] =>
  KNIGHT_VECTORS.reduce<LegalMove[]>((moves, delta) => {
    const target = addVector(piece.position, delta);
    if (!isWithinBoard(target, state.boardSize)) {
      return moves;
    }

    const occupant = findPieceAt(state.pieces, target);
    if (occupant && occupant.ownerId === piece.ownerId) {
      return moves;
    }

    moves.push({ to: target, capture: Boolean(occupant) });
    return moves;
  }, []);

const generatePawnMoves = ({ state, piece, intent }: MovementContext): LegalMove[] => {
  const moves: LegalMove[] = [];
  const direction = getPlayerDirection(state.players, piece.ownerId);
  const promotionRank = direction === 1 ? state.boardSize - 1 : 0;
  const startingRank = direction === 1 ? 1 : state.boardSize - 2;

  const forwardOne = { x: piece.position.x, y: piece.position.y + direction };
  const forwardTwo = { x: piece.position.x, y: piece.position.y + direction * 2 };

  if (intent === 'move') {
    if (isWithinBoard(forwardOne, state.boardSize) && !findPieceAt(state.pieces, forwardOne)) {
      moves.push({
        to: forwardOne,
        promotion: forwardOne.y === promotionRank ? DEFAULT_PROMOTION : undefined
      });

      if (
        piece.position.y === startingRank &&
        isWithinBoard(forwardTwo, state.boardSize) &&
        !findPieceAt(state.pieces, forwardTwo)
      ) {
        moves.push({ to: forwardTwo });
      }
    }
  }

  [-1, 1].forEach((deltaX) => {
    const target = { x: piece.position.x + deltaX, y: piece.position.y + direction };
    if (!isWithinBoard(target, state.boardSize)) {
      return;
    }

    if (intent === 'attack') {
      moves.push({ to: target });
      return;
    }

    const occupant = findPieceAt(state.pieces, target);
    if (occupant && occupant.ownerId !== piece.ownerId) {
      moves.push({
        to: target,
        capture: true,
        promotion: target.y === promotionRank ? DEFAULT_PROMOTION : undefined
      });
    }
  });

  return moves;
};

export const generateCandidateMoves = (
  state: GameStateSnapshot,
  piece: PieceState,
  intent: MovementIntent = 'move'
): LegalMove[] => {
  const context: MovementContext = { state, piece, intent };

  switch (piece.type) {
    case 'queen':
      return generateRayMoves(context, [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS]);
    case 'rook':
      return generateRayMoves(context, ORTHOGONAL_DIRECTIONS);
    case 'bishop':
      return generateRayMoves(context, DIAGONAL_DIRECTIONS);
    case 'king':
      return generateRayMoves(context, KING_DIRECTIONS, 1);
    case 'knight':
      return generateKnightMoves(context);
    case 'pawn':
      return generatePawnMoves(context);
    default:
      return [];
  }
};

export const generateAttackMoves = (state: GameStateSnapshot, piece: PieceState): LegalMove[] =>
  generateCandidateMoves(state, piece, 'attack');

export const reachesPromotionRank = (state: GameStateSnapshot, piece: PieceState, destination: Vector2) => {
  if (piece.type !== 'pawn') {
    return false;
  }

  const direction = getPlayerDirection(state.players, piece.ownerId);
  const promotionRank = direction === 1 ? state.boardSize - 1 : 0;
  return destination.y === promotionRank;
};
