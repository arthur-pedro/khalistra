import { PIECE_LIBRARY, ritualVictoryTargets } from './constants';
import type { GameStateSnapshot, MoveCommand, MoveRecord, PieceState, PlayerId, Vector2 } from './types';

const isSamePosition = (a: Vector2, b: Vector2) => a.x === b.x && a.y === b.y;

const isWithinBoard = (position: Vector2, boardSize: number) =>
  position.x >= 0 && position.y >= 0 && position.x < boardSize && position.y < boardSize;

const getOpponent = (players: [PlayerId, PlayerId], current: PlayerId) =>
  players[0] === current ? players[1] : players[0];

const chebyshevDistance = (from: Vector2, to: Vector2) =>
  Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));

const findPieceById = (pieces: PieceState[], pieceId: string) =>
  pieces.find((piece) => piece.id === pieceId);

const findPieceAt = (pieces: PieceState[], target: Vector2) =>
  pieces.find((piece) => isSamePosition(piece.position, target));

const assertMoveIsValid = (state: GameStateSnapshot, command: MoveCommand, actingPiece: PieceState) => {
  if (!isWithinBoard(command.to, state.boardSize)) {
    throw new Error('Jogada fora do tabuleiro.');
  }

  if (isSamePosition(actingPiece.position, command.to)) {
    throw new Error('Posição de destino deve ser diferente da atual.');
  }

  const distance = chebyshevDistance(actingPiece.position, command.to);
  if (distance > actingPiece.maxRange) {
    throw new Error('Peça não alcança a posição informada.');
  }

  const occupant = findPieceAt(state.pieces, command.to);
  if (occupant && occupant.ownerId === actingPiece.ownerId) {
    throw new Error('Não é possível capturar peças aliadas.');
  }
};

export const applyMove = (state: GameStateSnapshot, command: MoveCommand): GameStateSnapshot => {
  const piece = findPieceById(state.pieces, command.pieceId);
  if (!piece) {
    throw new Error('Peça não encontrada.');
  }

  if (piece.ownerId !== state.activePlayer) {
    throw new Error('Não é o turno deste jogador.');
  }

  assertMoveIsValid(state, command, piece);

  const target = command.to;
  const occupant = findPieceAt(state.pieces, target);

  const updatedPieces = state.pieces
    .filter((candidate) => !occupant || candidate.id !== occupant.id)
    .map((candidate) =>
      candidate.id === piece.id
        ? {
            ...candidate,
            position: target
          }
        : candidate
    );

  const victory = occupant && ritualVictoryTargets.includes(occupant.type) ? piece.ownerId : undefined;

  const moveRecord: MoveRecord = {
    ...command,
    from: piece.position,
    turn: state.turn,
    capturedPieceId: occupant?.id,
    winnerId: victory
  };

  return {
    ...state,
    turn: state.turn + 1,
    activePlayer: victory ? piece.ownerId : getOpponent(state.players, state.activePlayer),
    pieces: updatedPieces,
    status: victory ? 'completed' : state.status,
    winnerId: victory ?? state.winnerId,
    history: [...state.history, moveRecord]
  };
};

export const getPieceBlueprint = (pieceType: string) => PIECE_LIBRARY[pieceType as keyof typeof PIECE_LIBRARY];
