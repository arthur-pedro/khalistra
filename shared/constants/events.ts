import type { GameEventName } from '../types';

export const GAME_EVENT_NAMESPACE = 'game';

export const CORE_GAME_EVENTS: readonly GameEventName[] = [
  'game:join',
  'game:start',
  'game:move',
  'game:update',
  'game:finish',
] as const;

export const isCoreGameEvent = (eventName: string): eventName is GameEventName =>
  CORE_GAME_EVENTS.includes(eventName as GameEventName);
