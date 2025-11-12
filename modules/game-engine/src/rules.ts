import { DEFAULT_PROMOTION, PIECE_LIBRARY, PROMOTION_OPTIONS } from './constants';
import { findKing, findPieceAt, findPieceById, getOpponent, isSamePosition, isWithinBoard } from './board';
import { generateAttackMoves, generateCandidateMoves, reachesPromotionRank } from './movement';
import type {
  GameResolution,
  GameStateSnapshot,
  LegalMove,
  MoveCommand,
  MoveRecord,
  PieceState,
  PieceType,
  PlayerId,
  Vector2
} from './types';

const assertDestination = (state: GameStateSnapshot, piece: PieceState, target: Vector2) => {
  if (!isWithinBoard(target, state.boardSize)) {
    throw new Error('Jogada fora do tabuleiro.');
  }

  if (isSamePosition(piece.position, target)) {
    throw new Error('Posição de destino deve ser diferente da atual.');
  }
};

const assertPromotionChoice = (choice?: PieceType) => {
  if (!choice) {
    return;
  }

  if (!PROMOTION_OPTIONS.includes(choice)) {
    throw new Error('Promoção inválida para esta peça.');
  }
};

interface ProjectionResult {
  pieces: PieceState[];
  capturedPiece?: PieceState;
  promotion?: PieceType;
}

const projectPiecesAfterMove = (
  state: GameStateSnapshot,
  piece: PieceState,
  destination: Vector2,
  promotion?: PieceType
): ProjectionResult => {
  const occupant = findPieceAt(state.pieces, destination);
  const promotedType = promotion && promotion !== piece.type ? promotion : undefined;

  const updatedPieces = state.pieces
    .filter((candidate) => !occupant || candidate.id !== occupant.id)
    .map((candidate) => {
      if (candidate.id !== piece.id) {
        return candidate;
      }

      const promoted = promotedType
        ? {
            ...candidate,
            type: promotedType,
            label: PIECE_LIBRARY[promotedType].label
          }
        : candidate;

      return {
        ...promoted,
        position: destination,
        hasMoved: true
      };
    });

  return {
    pieces: updatedPieces,
    capturedPiece: occupant,
    promotion: promotedType
  };
};

const leavesKingInCheck = (
  state: GameStateSnapshot,
  piece: PieceState,
  destination: Vector2,
  promotion?: PieceType
): boolean => {
  const projection = projectPiecesAfterMove(state, piece, destination, promotion);
  const simulated: GameStateSnapshot = {
    ...state,
    pieces: projection.pieces
  };

  return isKingInCheck(simulated, piece.ownerId);
};

const computeLegalMovesForPiece = (
  state: GameStateSnapshot,
  piece: PieceState,
  playerId: PlayerId
): LegalMove[] => {
  if (piece.ownerId !== playerId) {
    return [];
  }

  const candidates = generateCandidateMoves(state, piece);
  return candidates.filter((candidate) => !leavesKingInCheck(state, piece, candidate.to, candidate.promotion));
};

const collectLegalMovesForPlayer = (state: GameStateSnapshot, playerId: PlayerId): number =>
  state.pieces
    .filter((piece) => piece.ownerId === playerId)
    .reduce((count, piece) => count + computeLegalMovesForPiece(state, piece, playerId).length, 0);

const resolvePromotion = (
  state: GameStateSnapshot,
  piece: PieceState,
  destination: Vector2,
  requested?: PieceType,
  suggested?: PieceType
): PieceType | undefined => {
  if (!reachesPromotionRank(state, piece, destination)) {
    return undefined;
  }

  const choice = requested ?? suggested ?? DEFAULT_PROMOTION;
  assertPromotionChoice(choice);
  return choice;
};

const evaluateResolution = (
  attackerId: PlayerId,
  defenderId: PlayerId,
  defenderInCheck: boolean,
  defenderMoves: number
): GameResolution | undefined => {
  if (defenderMoves > 0) {
    return undefined;
  }

  if (defenderInCheck) {
    return {
      reason: 'checkmate',
      winnerId: attackerId
    };
  }

  return {
    reason: 'stalemate'
  };
};

export const isKingInCheck = (state: GameStateSnapshot, playerId: PlayerId): boolean => {
  const king = findKing(state, playerId);
  const opponents = state.pieces.filter((piece) => piece.ownerId !== playerId);

  return opponents.some((piece) =>
    generateAttackMoves(state, piece).some((move) => isSamePosition(move.to, king.position))
  );
};

export const listLegalMoves = (
  state: GameStateSnapshot,
  pieceId: string,
  options?: { forPlayerId?: PlayerId }
): LegalMove[] => {
  const piece = findPieceById(state.pieces, pieceId);
  if (!piece) {
    return [];
  }

  const actingPlayer = options?.forPlayerId ?? piece.ownerId;
  if (piece.ownerId !== actingPlayer) {
    return [];
  }

  return computeLegalMovesForPiece(state, piece, actingPlayer);
};

export const applyMove = (state: GameStateSnapshot, command: MoveCommand): GameStateSnapshot => {
  const piece = findPieceById(state.pieces, command.pieceId);
  if (!piece) {
    throw new Error('Peça não encontrada.');
  }

  if (piece.ownerId !== state.activePlayer) {
    throw new Error('Não é o turno deste jogador.');
  }

  assertDestination(state, piece, command.to);

  const legalMoves = computeLegalMovesForPiece(state, piece, piece.ownerId);
  const selectedMove = legalMoves.find((move) => isSamePosition(move.to, command.to));
  if (!selectedMove) {
    throw new Error('Movimento inválido para esta peça.');
  }

  const promotion = resolvePromotion(state, piece, command.to, command.promoteTo, selectedMove.promotion);
  const projection = projectPiecesAfterMove(state, piece, command.to, promotion);
  const opponentId = getOpponent(state.players, state.activePlayer);

  const nextState: GameStateSnapshot = {
    ...state,
    pieces: projection.pieces
  };

  const opponentInCheck = isKingInCheck(nextState, opponentId);
  const opponentMoves = collectLegalMovesForPlayer(nextState, opponentId);
  const resolution = evaluateResolution(state.activePlayer, opponentId, opponentInCheck, opponentMoves);

  const status = resolution ? 'completed' : opponentInCheck ? 'check' : 'in-progress';
  const checkedPlayerId = resolution ? undefined : opponentInCheck ? opponentId : undefined;

  const moveRecord: MoveRecord = {
    ...command,
    promoteTo: command.promoteTo,
    from: piece.position,
    turn: state.turn,
    capturedPieceId: projection.capturedPiece?.id,
    capturedPieceType: projection.capturedPiece?.type,
    promotion,
    check: opponentInCheck,
    checkmate: resolution?.reason === 'checkmate',
    stalemate: resolution?.reason === 'stalemate',
    winnerId: resolution?.winnerId
  };

  return {
    ...nextState,
    turn: state.turn + 1,
    activePlayer: opponentId,
    status,
    checkedPlayerId,
    winnerId: resolution?.winnerId,
    resolution,
    history: [...state.history, moveRecord]
  };
};

export const getPieceBlueprint = (pieceType: string) => PIECE_LIBRARY[pieceType as keyof typeof PIECE_LIBRARY];
