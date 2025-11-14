import {
  BadRequestException,
  HttpException,
  Inject,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { GameStateSnapshot, MoveCommand, PlayerId } from '@khalistra/game-engine';
import { stateToUpdateEvent } from '@khalistra/game-engine';
import {
  type GameRealtimeHandshakePayload,
  type GameRealtimeMovePayload,
  type GameRealtimeReplayPayload,
  type GameSocketAck,
  type RealtimeSnapshotEnvelope,
} from '@khalistra/shared/types';
import type { Server, Socket } from 'socket.io';
import { MatchesService } from './matches.service';
import {
  MATCHES_EVENT_EMITTER,
  MATCH_FINISHED_EVENT,
  MATCH_UPDATED_EVENT,
  type MatchUpdateBroadcast,
  type MatchesEventEmitter,
} from './matches.events';
import type { GameEvent, GameGatewayErrorCode } from '@khalistra/shared/types';

type MatchEnvelope = RealtimeSnapshotEnvelope<GameStateSnapshot>;

interface MatchSocketData {
  matchRoom?: string;
  playerId?: PlayerId;
}

interface MatchSocket extends Socket {
  data: MatchSocketData;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MatchesGateway implements OnModuleDestroy {
  @WebSocketServer()
  private server?: Server;

  private readonly logger = new Logger(MatchesGateway.name);

  private readonly onMatchUpdate = (payload: MatchUpdateBroadcast) => {
    if (!this.server) {
      return;
    }
    this.server.to(this.roomName(payload.matchId)).emit('game:update', payload);
  };

  private readonly onMatchFinished = (payload: GameEvent<'game:finish'>) => {
    if (!this.server) {
      return;
    }
    this.server.to(this.roomName(payload.payload.matchId)).emit('game:finish', payload);
  };

  constructor(
    private readonly matchesService: MatchesService,
    @Inject(MATCHES_EVENT_EMITTER) private readonly matchesEvents: MatchesEventEmitter,
  ) {
    this.matchesEvents.on(MATCH_UPDATED_EVENT, this.onMatchUpdate);
    this.matchesEvents.on(MATCH_FINISHED_EVENT, this.onMatchFinished);
  }

  onModuleDestroy() {
    this.matchesEvents.off(MATCH_UPDATED_EVENT, this.onMatchUpdate);
    this.matchesEvents.off(MATCH_FINISHED_EVENT, this.onMatchFinished);
  }

  @SubscribeMessage('game:join')
  async handleJoin(
    @ConnectedSocket() client: MatchSocket,
    @MessageBody() payload: GameRealtimeHandshakePayload,
  ): Promise<GameSocketAck<MatchEnvelope>> {
    if (!payload.matchId) {
      return this.buildError('PAYLOAD_INVALID', 'matchId é obrigatório.');
    }

    try {
      const state = await this.matchesService.getMatchState(payload.matchId);
      this.assignRoom(client, payload.matchId);
      client.data.playerId = payload.playerId;
      return this.buildSuccess(this.toEnvelope(state));
    } catch (error) {
      return this.mapExceptionToAck(error);
    }
  }

  @SubscribeMessage('game:move')
  async handleMove(
    @MessageBody() payload: GameRealtimeMovePayload<MoveCommand>,
  ): Promise<GameSocketAck<MatchEnvelope>> {
    if (!payload.matchId || !payload.command.pieceId) {
      return this.buildError('PAYLOAD_INVALID', 'matchId e comando são obrigatórios.');
    }

    try {
      const nextState = await this.matchesService.submitMove(payload.matchId, payload.command);
      return this.buildSuccess(this.toEnvelope(nextState));
    } catch (error) {
      return this.mapExceptionToAck(error);
    }
  }

  @SubscribeMessage('game:replay')
  async handleReplay(
    @MessageBody() payload: GameRealtimeReplayPayload,
  ): Promise<GameSocketAck<MatchEnvelope>> {
    if (!payload.matchId) {
      return this.buildError('PAYLOAD_INVALID', 'matchId é obrigatório.');
    }

    try {
      const state = await this.matchesService.getMatchState(payload.matchId);
      return this.buildSuccess(this.toEnvelope(state));
    } catch (error) {
      return this.mapExceptionToAck(error);
    }
  }

  private toEnvelope(state: GameStateSnapshot): MatchEnvelope {
    return {
      matchId: state.matchId,
      state,
      event: stateToUpdateEvent(state),
    };
  }

  private buildSuccess(payload: MatchEnvelope): GameSocketAck<MatchEnvelope> {
    return {
      ok: true,
      data: payload,
    };
  }

  private buildError(code: GameGatewayErrorCode, message: string): GameSocketAck<never> {
    return {
      ok: false,
      error: {
        code,
        message,
      },
    };
  }

  private mapExceptionToAck(error: unknown): GameSocketAck<never> {
    if (error instanceof NotFoundException) {
      return this.buildError('MATCH_NOT_FOUND', this.extractMessage(error));
    }

    if (error instanceof BadRequestException) {
      const message = this.extractMessage(error);
      if (message.includes('finalizada')) {
        return this.buildError('MATCH_COMPLETED', message);
      }
      return this.buildError('PAYLOAD_INVALID', message);
    }

    if (error instanceof HttpException) {
      return this.buildError('PAYLOAD_INVALID', this.extractMessage(error));
    }

    this.logger.error('Falha inesperada no gateway de partidas', error as Error);
    return this.buildError('INTERNAL_ERROR', 'Falha inesperada ao processar o evento.');
  }

  private extractMessage(exception: HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (response && typeof response === 'object' && 'message' in response) {
      const details = response.message;
      if (Array.isArray(details)) {
        return details.join(', ');
      }
      if (typeof details === 'string') {
        return details;
      }
    }
    return exception.message;
  }

  private assignRoom(client: MatchSocket, matchId: string) {
    const currentRoom = client.data.matchRoom;
    if (currentRoom && currentRoom !== matchId) {
      void client.leave(this.roomName(currentRoom));
    }
    void client.join(this.roomName(matchId));
    client.data.matchRoom = matchId;
  }

  private roomName(matchId: string) {
    return `match:${matchId}`;
  }
}
