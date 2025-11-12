export type PlayerId = string;

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface Vector2 {
  x: number;
  y: number;
}

export interface PieceBlueprint {
  type: PieceType;
  label: string;
}

export interface PieceState extends PieceBlueprint {
  id: string;
  ownerId: PlayerId;
  position: Vector2;
  hasMoved: boolean;
}

export type GameStatus = 'awaiting' | 'in-progress' | 'check' | 'ritual' | 'completed';

export type GameResolutionReason = 'checkmate' | 'stalemate' | 'timeout' | 'surrender';

export interface GameResolution {
  reason: GameResolutionReason;
  winnerId?: PlayerId;
}

export interface MoveCommand {
  pieceId: string;
  to: Vector2;
  ritualCard?: string;
  promoteTo?: PieceType;
}

export interface MoveRecord extends MoveCommand {
  from: Vector2;
  turn: number;
  capturedPieceId?: string;
  capturedPieceType?: PieceType;
  promotion?: PieceType;
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
  winnerId?: PlayerId;
}

export interface LegalMove {
  to: Vector2;
  capture?: boolean;
  promotion?: PieceType;
}

export interface GameStateSnapshot {
  matchId: string;
  boardSize: number;
  turn: number;
  activePlayer: PlayerId;
  players: [PlayerId, PlayerId];
  status: GameStatus;
  winnerId?: PlayerId;
  resolution?: GameResolution;
  checkedPlayerId?: PlayerId;
  pieces: PieceState[];
  history: MoveRecord[];
}

export interface CreateStateInput {
  matchId: string;
  players: [PlayerId, PlayerId];
}
