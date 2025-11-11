import { buildGameEvent } from '@khalistra/shared/types';
import type { GameEvent } from '@khalistra/shared/types';
import type { GameStateSnapshot } from './types';

export const stateToUpdateEvent = (state: GameStateSnapshot): GameEvent<'game:update'> =>
  buildGameEvent('game:update', {
    matchId: state.matchId,
    state: {
      boardSize: state.boardSize,
      turn: state.turn,
      status: state.status,
      winnerId: state.winnerId,
      activePlayer: state.activePlayer,
      pieces: state.pieces.map((piece) => ({
        id: piece.id,
        ownerId: piece.ownerId,
        type: piece.type,
        position: piece.position
      }))
    }
  });
