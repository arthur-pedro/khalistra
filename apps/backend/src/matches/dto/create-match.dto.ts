import type { PlayerId, Vector2 } from '@khalistra/game-engine';

export interface CreateMatchDto {
  matchId?: string;
  players?: PlayerId[];
}

export interface SubmitMoveDto {
  pieceId?: string;
  to?: Vector2;
  ritualCard?: string;
}
