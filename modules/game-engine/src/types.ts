export type PlayerId = string;

export type PieceType = 'sentinel' | 'oracle' | 'dancer';

export interface Vector2 {
  x: number;
  y: number;
}

export interface PieceBlueprint {
  type: PieceType;
  maxRange: number;
}

export interface PieceState extends PieceBlueprint {
  id: string;
  ownerId: PlayerId;
  position: Vector2;
}

export type GameStatus = 'awaiting' | 'in-progress' | 'ritual' | 'completed';

export interface MoveCommand {
  pieceId: string;
  to: Vector2;
  ritualCard?: string;
}

export interface MoveRecord extends MoveCommand {
  from: Vector2;
  turn: number;
  capturedPieceId?: string;
  winnerId?: PlayerId;
}

export interface GameStateSnapshot {
  matchId: string;
  boardSize: number;
  turn: number;
  activePlayer: PlayerId;
  players: [PlayerId, PlayerId];
  status: GameStatus;
  winnerId?: PlayerId;
  pieces: PieceState[];
  history: MoveRecord[];
}

export interface CreateStateInput {
  matchId: string;
  players: [PlayerId, PlayerId];
}
