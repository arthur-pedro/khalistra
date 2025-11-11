import { BOARD_SIZE, PIECE_LIBRARY, STARTING_RANK, buildPieceId } from './constants';
import type { CreateStateInput, GameStateSnapshot, PieceState, PlayerId, Vector2 } from './types';

const createPiecesForPlayer = (
  playerId: PlayerId,
  baseline: number,
  mirrorX = false
): PieceState[] => {
  return STARTING_RANK.map((pieceType, index) => {
    const blueprint = PIECE_LIBRARY[pieceType];
    const position: Vector2 = {
      x: mirrorX ? BOARD_SIZE - 1 - index : index,
      y: baseline
    };
    return {
      ...blueprint,
      id: buildPieceId(playerId, pieceType, index),
      ownerId: playerId,
      position
    };
  });
};

export const createInitialState = ({ matchId, players }: CreateStateInput): GameStateSnapshot => {
  if (players.length !== 2) {
    throw new Error('Khalistra engine currently suporta apenas duelos 1v1.');
  }

  const [firstPlayer, secondPlayer] = players;
  const playerOnePieces = createPiecesForPlayer(firstPlayer, 0);
  const playerTwoPieces = createPiecesForPlayer(secondPlayer, BOARD_SIZE - 1, true);

  return {
    matchId,
    boardSize: BOARD_SIZE,
    turn: 1,
    activePlayer: firstPlayer,
    players,
    status: 'in-progress',
    pieces: [...playerOnePieces, ...playerTwoPieces],
    history: []
  };
};
