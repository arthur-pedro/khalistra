import { BACK_RANK, BOARD_SIZE, PIECE_LIBRARY, buildPieceId } from './constants';
import type {
  CreateStateInput,
  GameStateSnapshot,
  PieceState,
  PieceType,
  PlayerId,
  Vector2
} from './types';

const createPiece = (playerId: PlayerId, pieceType: PieceType, position: Vector2, index: number): PieceState => ({
  ...PIECE_LIBRARY[pieceType],
  id: buildPieceId(playerId, pieceType, index),
  ownerId: playerId,
  position,
  hasMoved: false
});

const createBackRank = (playerId: PlayerId, baseline: number): PieceState[] =>
  BACK_RANK.map((pieceType, column) => createPiece(playerId, pieceType, { x: column, y: baseline }, column));

const createPawns = (playerId: PlayerId, pawnRow: number): PieceState[] =>
  Array.from({ length: BOARD_SIZE }, (_, column) =>
    createPiece(playerId, 'pawn', { x: column, y: pawnRow }, column)
  );

const createPiecesForPlayer = (playerId: PlayerId, orientation: 1 | -1): PieceState[] => {
  const baseRank = orientation === 1 ? 0 : BOARD_SIZE - 1;
  const pawnRank = baseRank + orientation;

  return [...createBackRank(playerId, baseRank), ...createPawns(playerId, pawnRank)];
};

export const createInitialState = ({ matchId, players }: CreateStateInput): GameStateSnapshot => {
  if (players.length !== 2) {
    throw new Error('Khalistra engine currently suporta apenas duelos 1v1.');
  }

  const [firstPlayer, secondPlayer] = players;
  const playerOnePieces = createPiecesForPlayer(firstPlayer, 1);
  const playerTwoPieces = createPiecesForPlayer(secondPlayer, -1);

  return {
    matchId,
    boardSize: BOARD_SIZE,
    turn: 1,
    activePlayer: firstPlayer,
    players,
    status: 'in-progress',
    pieces: [...playerOnePieces, ...playerTwoPieces],
    history: [],
    resolution: undefined,
    checkedPlayerId: undefined,
    winnerId: undefined
  };
};
