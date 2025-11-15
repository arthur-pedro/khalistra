import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { stateToUpdateEvent, type GameStateSnapshot } from '@khalistra/game-engine';
import type { Room as PrismaRoom, RoomStatus as PrismaRoomStatus } from '@prisma/client';
import type {
  GameEvent,
  RealtimeSnapshotEnvelope,
  RoomHandshakePayload,
  RoomSnapshot,
  RoomStartResponse,
} from '@khalistra/shared/types';
import { logStructuredEvent } from '@khalistra/shared/utils';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesService } from '../matches/matches.service';
import {
  MATCHES_EVENT_EMITTER,
  MATCH_FINISHED_EVENT,
  type MatchesEventEmitter,
} from '../matches/matches.events';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const LOBBY_TTL_MS = 15 * 60 * 1000;
const MATCH_TTL_MS = 2 * 60 * 60 * 1000;

type MatchEnvelope = RealtimeSnapshotEnvelope<GameStateSnapshot>;
type Seat = 'host' | 'guest';

const STATUS_MAP: Record<PrismaRoomStatus, RoomSnapshot['status']> = {
  WAITING: 'waiting',
  READY: 'ready',
  IN_MATCH: 'in-match',
  CLOSED: 'closed',
  EXPIRED: 'expired',
};

@Injectable()
export class RoomsService implements OnModuleDestroy {
  private readonly logger = new Logger(RoomsService.name);
  private readonly matchFinishedListener = (event: GameEvent<'game:finish'>) => {
    void this.handleMatchFinished(event);
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesService: MatchesService,
    @Optional()
    @Inject(MATCHES_EVENT_EMITTER)
    private readonly matchesEvents?: MatchesEventEmitter,
  ) {
    this.matchesEvents?.on(MATCH_FINISHED_EVENT, this.matchFinishedListener);
  }

  onModuleDestroy() {
    this.matchesEvents?.off(MATCH_FINISHED_EVENT, this.matchFinishedListener);
  }

  async createRoom(payload: { codename: string }): Promise<RoomHandshakePayload> {
    const codename = this.normalizeCodename(payload.codename);
    const code = await this.reserveCode();
    const hostSecret = this.generateSecret();
    const hostPlayerId = this.generatePlayerId();

    await this.prisma.player.create({
      data: {
        id: hostPlayerId,
        alias: this.buildAlias(codename, code),
      },
    });

    const room = await this.prisma.room.create({
      data: {
        code,
        status: 'WAITING',
        hostPlayerId,
        hostDisplayName: codename,
        hostSecret,
        hostJoinedAt: new Date(),
        expiresAt: this.futureDate(LOBBY_TTL_MS),
      },
    });

    this.logRoomEvent('room:create', room.code, { seat: 'host', codename });
    return this.buildHandshake(room, 'host', hostSecret);
  }

  async joinRoom(code: string, payload: { codename: string }): Promise<RoomHandshakePayload> {
    const codename = this.normalizeCodename(payload.codename);
    const room = await this.findRoomOrThrow(code);
    await this.ensureRoomActive(room);

    if (room.guestPlayerId) {
      throw new ConflictException('A sala já possui um convidado.');
    }

    const guestSecret = this.generateSecret();
    const guestPlayerId = this.generatePlayerId();

    await this.prisma.player.create({
      data: {
        id: guestPlayerId,
        alias: this.buildAlias(codename, room.code),
      },
    });

    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        guestPlayerId,
        guestDisplayName: codename,
        guestSecret,
        guestJoinedAt: new Date(),
        status: 'READY',
        expiresAt: this.futureDate(LOBBY_TTL_MS),
      },
    });

    this.logRoomEvent('room:join', room.code, { seat: 'guest', codename });
    return this.buildHandshake(updated, 'guest', guestSecret);
  }

  async getRoom(code: string): Promise<RoomSnapshot> {
    const room = await this.findRoomOrThrow(code);
    const normalized = await this.applyExpiration(room);
    return this.toSnapshot(normalized);
  }

  async startMatch(code: string, secret: string): Promise<RoomStartResponse<MatchEnvelope>> {
    const sanitizedSecret = secret?.trim();
    if (!sanitizedSecret) {
      throw new BadRequestException('Token do anfitrião é obrigatório.');
    }

    const room = await this.findRoomOrThrow(code);
    await this.ensureRoomActive(room);

    if (room.status !== 'READY') {
      throw new BadRequestException('Aguardando convidado antes de iniciar o duelo.');
    }

    if (room.hostSecret !== sanitizedSecret) {
      throw new BadRequestException('Host não autorizado para iniciar esta sala.');
    }

    if (!room.guestPlayerId) {
      throw new BadRequestException('É necessário um convidado para iniciar o duelo.');
    }

    const matchId = `room-${room.code}-${randomUUID()}`;
    const state = await this.matchesService.createMatch({
      matchId,
      players: [room.hostPlayerId, room.guestPlayerId],
    });

    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        matchId,
        status: 'IN_MATCH',
        expiresAt: this.futureDate(MATCH_TTL_MS),
      },
    });

    this.logRoomEvent('room:start', room.code, { matchId });

    return {
      room: this.toSnapshot(updated),
      match: this.buildMatchEnvelope(state),
    };
  }

  private readonly handleMatchFinished = async (event: GameEvent<'game:finish'>) => {
    try {
      await this.prisma.room.updateMany({
        where: {
          matchId: event.payload.matchId,
        },
        data: {
          status: 'CLOSED',
          expiresAt: this.futureDate(LOBBY_TTL_MS),
        },
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error : new Error(String(error));
      this.logger.warn('Falha ao atualizar sala após finalização da partida', reason);
    }
  };

  private async reserveCode(attempt = 0): Promise<string> {
    if (attempt > 5) {
      throw new Error('Não foi possível gerar um código de sala único.');
    }

    const code = this.generateCode();
    const existing = await this.prisma.room.findUnique({ where: { code } });
    if (existing) {
      return this.reserveCode(attempt + 1);
    }
    return code;
  }

  private generateCode() {
    const bytes = randomBytes(CODE_LENGTH);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      const index = bytes[i] % CODE_ALPHABET.length;
      code += CODE_ALPHABET[index];
    }
    return code;
  }

  private generateSecret() {
    return randomBytes(18).toString('hex');
  }

  private generatePlayerId() {
    return randomUUID();
  }

  private async findRoomOrThrow(code: string) {
    const normalized = this.normalizeCode(code);
    const room = await this.prisma.room.findUnique({ where: { code: normalized } });
    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }
    return room;
  }

  private async ensureRoomActive(room: PrismaRoom) {
    if (room.status === 'CLOSED') {
      throw new BadRequestException('Esta sala já foi encerrada.');
    }

    if (room.status === 'EXPIRED') {
      throw new BadRequestException('Esta sala expirou. Crie uma nova sessão.');
    }

    if (!this.isRoomExpired(room)) {
      return;
    }

    await this.prisma.room.update({
      where: { id: room.id },
      data: { status: 'EXPIRED' },
    });
    throw new BadRequestException('Esta sala expirou. Crie uma nova sessão.');
  }

  private async applyExpiration(room: PrismaRoom) {
    if (!this.isRoomExpired(room) || room.status === 'CLOSED') {
      return room;
    }

    if (room.status === 'EXPIRED') {
      return room;
    }

    return this.prisma.room.update({
      where: { id: room.id },
      data: { status: 'EXPIRED' },
    });
  }

  private isRoomExpired(room: PrismaRoom) {
    return room.expiresAt.getTime() <= Date.now();
  }

  private futureDate(offset: number) {
    return new Date(Date.now() + offset);
  }

  private buildAlias(codename: string, code: string) {
    const suffix = code.slice(0, 3);
    const normalized = codename.length > 32 ? `${codename.slice(0, 29)}...` : codename;
    return `${normalized} · ${suffix}`;
  }

  private normalizeCodename(raw: string) {
    const value = raw?.trim();
    if (!value) {
      throw new BadRequestException('Escolha um codinome para entrar na sala.');
    }

    const normalized = value.replace(/\s+/g, ' ');
    if (normalized.length < 3 || normalized.length > 32) {
      throw new BadRequestException('Codinome deve ter entre 3 e 32 caracteres.');
    }
    return normalized;
  }

  private normalizeCode(raw: string) {
    const value = raw?.trim().toUpperCase();
    if (!value || !/^[A-Z0-9]{6,8}$/.test(value)) {
      throw new BadRequestException('Código de sala deve conter de 6 a 8 caracteres alfanuméricos.');
    }
    return value;
  }

  private buildHandshake(room: PrismaRoom, seat: Seat, secret: string): RoomHandshakePayload {
    return {
      room: this.toSnapshot(room),
      seat,
      secret,
    };
  }

  private toSnapshot(room: PrismaRoom): RoomSnapshot {
    return {
      code: room.code,
      status: STATUS_MAP[room.status],
      createdAt: room.createdAt.toISOString(),
      expiresAt: room.expiresAt.toISOString(),
      matchId: room.matchId ?? undefined,
      host: {
        seat: 'host',
        playerId: room.hostPlayerId,
        codename: room.hostDisplayName,
        joinedAt: (room.hostJoinedAt ?? room.createdAt).toISOString(),
      },
      guest: room.guestPlayerId
        ? {
            seat: 'guest',
            playerId: room.guestPlayerId,
            codename: room.guestDisplayName ?? 'Convidado',
            joinedAt: (room.guestJoinedAt ?? room.updatedAt).toISOString(),
          }
        : undefined,
    };
  }

  private buildMatchEnvelope(state: GameStateSnapshot): MatchEnvelope {
    return {
      matchId: state.matchId,
      state,
      event: stateToUpdateEvent(state),
    };
  }

  private logRoomEvent(action: string, code: string, context: Record<string, unknown>) {
    logStructuredEvent({
      action,
      matchId: code,
      context,
    });
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
