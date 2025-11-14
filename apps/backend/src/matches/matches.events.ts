import { EventEmitter } from 'node:events';
import type { GameStateSnapshot } from '@khalistra/game-engine';
import type { GameEvent } from '@khalistra/shared/types';

export const MATCHES_EVENT_EMITTER = Symbol('MATCHES_EVENT_EMITTER');
export const MATCH_UPDATED_EVENT = 'matches.updated';
export const MATCH_FINISHED_EVENT = 'matches.finished';

export interface MatchUpdateBroadcast {
  matchId: string;
  state: GameStateSnapshot;
  event: GameEvent<'game:update'>;
}

export type MatchesEventEmitter = EventEmitter & {
  on(
    event: typeof MATCH_UPDATED_EVENT,
    listener: (payload: MatchUpdateBroadcast) => void,
  ): MatchesEventEmitter;
  on(
    event: typeof MATCH_FINISHED_EVENT,
    listener: (payload: GameEvent<'game:finish'>) => void,
  ): MatchesEventEmitter;
  off(
    event: typeof MATCH_UPDATED_EVENT,
    listener: (payload: MatchUpdateBroadcast) => void,
  ): MatchesEventEmitter;
  off(
    event: typeof MATCH_FINISHED_EVENT,
    listener: (payload: GameEvent<'game:finish'>) => void,
  ): MatchesEventEmitter;
  emit(event: typeof MATCH_UPDATED_EVENT, payload: MatchUpdateBroadcast): boolean;
  emit(event: typeof MATCH_FINISHED_EVENT, payload: GameEvent<'game:finish'>): boolean;
};

export const createMatchesEventEmitter = (): MatchesEventEmitter =>
  new EventEmitter() as MatchesEventEmitter;
