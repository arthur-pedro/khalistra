import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { applyMove, createInitialState, stateToUpdateEvent } from '@khalistra/game-engine';
import type { GameStateSnapshot, MoveCommand, PlayerId } from '@khalistra/game-engine';
import { buildGameEvent, type GameEvent } from '@khalistra/shared/types';
import { logStructuredEvent } from '@khalistra/shared/utils';

export interface CreateMatchPayload {
  matchId: string;
  players: [PlayerId, PlayerId];
}

@Injectable()
export class MatchesService {
  private readonly matches = new Map<string, GameStateSnapshot>();

  createMatch(payload: CreateMatchPayload): GameStateSnapshot {
    const { matchId, players } = payload;

    if (this.matches.has(matchId)) {
      throw new ConflictException(`Partida ${matchId} já existe.`);
    }

    const state = createInitialState({ matchId, players });
    this.matches.set(matchId, state);

    this.writeEvent(
      buildGameEvent('game:start', {
        matchId,
        seed: matchId,
        firstPlayerId: state.activePlayer,
      }),
    );

    this.emitUpdate(state);

    return state;
  }

  getMatchState(matchId: string): GameStateSnapshot {
    const state = this.matches.get(matchId);
    if (!state) {
      throw new NotFoundException(`Partida ${matchId} não encontrada.`);
    }

    return state;
  }

  submitMove(matchId: string, command: MoveCommand): GameStateSnapshot {
    const currentState = this.getMatchState(matchId);

    if (currentState.status === 'completed') {
      throw new BadRequestException('Partida já finalizada.');
    }

    const updatedState = applyMove(currentState, command);
    this.matches.set(matchId, updatedState);

    this.writeEvent(
      buildGameEvent('game:move', {
        matchId,
        playerId: currentState.activePlayer,
        action: `${command.pieceId}->(${command.to.x.toString()},${command.to.y.toString()})`,
        turn: currentState.turn,
      }),
    );

    if (updatedState.status === 'completed') {
      const finishReason = updatedState.resolution?.reason ?? 'ritual';
      this.writeEvent(
        buildGameEvent('game:finish', {
          matchId,
          winnerId: updatedState.winnerId,
          reason: finishReason,
        }),
      );
    }

    this.emitUpdate(updatedState);

    return updatedState;
  }

  private emitUpdate(state: GameStateSnapshot) {
    const event = stateToUpdateEvent(state);
    this.writeEvent(event);
  }

  private writeEvent(event: GameEvent) {
    logStructuredEvent({
      action: event.name,
      matchId: event.payload.matchId,
      context: event.payload,
    });
  }
}
