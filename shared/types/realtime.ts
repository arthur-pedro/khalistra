import type { GameEvent } from './events';

export type GameGatewayErrorCode =
  | 'MATCH_NOT_FOUND'
  | 'MATCH_COMPLETED'
  | 'PAYLOAD_INVALID'
  | 'PLAYER_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

export interface GameSocketError<Code extends string = GameGatewayErrorCode> {
  code: Code;
  message: string;
}

export type GameSocketAck<TPayload, Code extends string = GameGatewayErrorCode> =
  | { ok: true; data: TPayload }
  | { ok: false; error: GameSocketError<Code> };

export interface GameRealtimeHandshakePayload {
  matchId: string;
  playerId?: string;
}

export interface GameRealtimeMovePayload<TCommand = Record<string, unknown>> {
  matchId: string;
  command: TCommand;
  playerId?: string;
}

export interface GameRealtimeReplayPayload {
  matchId: string;
}

export interface RealtimeSnapshotEnvelope<TState = Record<string, unknown>> {
  matchId: string;
  state: TState;
  event: GameEvent<'game:update'>;
}
