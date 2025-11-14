import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { applyMove, createInitialState, stateToUpdateEvent } from '@khalistra/game-engine';
import type { GameStateSnapshot, MoveCommand, PlayerId } from '@khalistra/game-engine';
import { buildGameEvent, type GameEvent } from '@khalistra/shared/types';
import { logStructuredEvent } from '@khalistra/shared/utils';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  MATCHES_EVENT_EMITTER,
  MATCH_FINISHED_EVENT,
  MATCH_UPDATED_EVENT,
  type MatchesEventEmitter,
} from './matches.events';

export interface CreateMatchPayload {
  matchId: string;
  players: [PlayerId, PlayerId];
}

@Injectable()
export class MatchesService implements OnModuleInit {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Optional()
    @Inject(MATCHES_EVENT_EMITTER)
    private readonly matchesEvents?: MatchesEventEmitter,
  ) {}

  async onModuleInit() {
    await this.restoreActiveMatches();
  }

  async createMatch(payload: CreateMatchPayload): Promise<GameStateSnapshot> {
    const { matchId, players } = payload;

    await this.ensurePlayersExist(players);
    const existing = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (existing) {
      throw new ConflictException(`Partida ${matchId} já existe.`);
    }

    const state = createInitialState({ matchId, players });
    await this.prisma.match.create({
      data: {
        id: matchId,
        lightPlayerId: players[0],
        shadowPlayerId: players[1],
        status: state.status,
        activePlayerId: state.activePlayer,
        turn: state.turn,
        snapshots: {
          create: {
            turn: state.turn,
            kind: SNAPSHOT_INIT,
            state: this.serializeState(state),
          },
        },
      },
    });

    await this.cacheState(state);

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

  async getMatchState(matchId: string): Promise<GameStateSnapshot> {
    return this.loadState(matchId);
  }

  async submitMove(matchId: string, command: MoveCommand): Promise<GameStateSnapshot> {
    const currentState = await this.loadState(matchId);

    if (currentState.status === 'completed') {
      throw new BadRequestException('Partida já finalizada.');
    }

    const updatedState = applyMove(currentState, command);
    const lastMove = updatedState.history.at(-1);

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: updatedState.status,
        activePlayerId: updatedState.activePlayer,
        winnerId: updatedState.winnerId ?? null,
        turn: updatedState.turn,
      },
    });

    await this.prisma.matchSnapshot.create({
      data: {
        matchId,
        turn: updatedState.turn,
        kind: SNAPSHOT_RUNTIME,
        state: this.serializeState(updatedState),
      },
    });

    if (lastMove) {
      await this.prisma.moveRecord.create({
        data: {
          matchId,
          actorId: currentState.activePlayer,
          pieceId: command.pieceId,
          turn: updatedState.turn,
        payload: lastMove as unknown as SerializedState,
        },
      });
    }

    await this.cacheState(updatedState);

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
      const finishEvent = buildGameEvent('game:finish', {
        matchId,
        winnerId: updatedState.winnerId,
        reason: finishReason,
      });
      this.emitFinish(finishEvent);
    }

    this.emitUpdate(updatedState);

    return updatedState;
  }

  private async loadState(matchId: string): Promise<GameStateSnapshot> {
    const cached = await this.redis.getJson<GameStateSnapshot>(this.cacheKey(matchId));
    if (cached) {
      return cached;
    }

    const snapshot = await this.prisma.matchSnapshot.findFirst({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException(`Partida ${matchId} não encontrada.`);
    }

    const state = this.deserializeState(snapshot.state);
    await this.cacheState(state);
    return state;
  }

  private emitUpdate(state: GameStateSnapshot) {
    const event = stateToUpdateEvent(state);
    this.writeEvent(event);
    this.matchesEvents?.emit(MATCH_UPDATED_EVENT, {
      matchId: state.matchId,
      state,
      event,
    });
  }

  private emitFinish(event: GameEvent<'game:finish'>) {
    this.writeEvent(event);
    this.matchesEvents?.emit(MATCH_FINISHED_EVENT, event);
  }

  private writeEvent(event: GameEvent) {
    logStructuredEvent({
      action: event.name,
      matchId: event.payload.matchId,
      context: event.payload,
    });
  }

  private async ensurePlayersExist(players: [PlayerId, PlayerId]) {
    const found = await this.prisma.player.findMany({
      where: { id: { in: players } },
      select: { id: true },
    });
    if (found.length !== players.length) {
      throw new BadRequestException('Jogadores informados não existem no banco de dados.');
    }
  }

  private serializeState(state: GameStateSnapshot): SerializedState {
    return state as unknown as SerializedState;
  }

  private deserializeState(payload: SerializedState): GameStateSnapshot {
    return payload as unknown as GameStateSnapshot;
  }

  private cacheKey(matchId: string) {
    return `match:${matchId}:state`;
  }

  private async cacheState(state: GameStateSnapshot) {
    await this.redis.setJson(this.cacheKey(state.matchId), state);
  }

  private async restoreActiveMatches() {
    const activeMatches = await this.prisma.match.findMany({
      where: { status: { not: 'completed' } },
      select: { id: true },
    });

    await Promise.all(
      activeMatches.map(async (match: { id: string }) => {
        const snapshot = await this.prisma.matchSnapshot.findFirst({
          where: { matchId: match.id },
          orderBy: { createdAt: 'desc' },
        });
        if (!snapshot) {
          return;
        }
        await this.redis.setJson(this.cacheKey(match.id), this.deserializeState(snapshot.state));
      }),
    );

    if (activeMatches.length) {
      this.logger.log(`Reidratadas ${activeMatches.length} partidas em andamento.`);
    }
  }
}
type SnapshotKind = 'INIT' | 'RUNTIME';

const SNAPSHOT_INIT: SnapshotKind = 'INIT';
const SNAPSHOT_RUNTIME: SnapshotKind = 'RUNTIME';
type SerializedState = Record<string, unknown>;
