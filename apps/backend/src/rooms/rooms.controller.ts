import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { GameStateSnapshot } from '@khalistra/game-engine';
import type {
  RealtimeSnapshotEnvelope,
  RoomHandshakePayload,
  RoomSnapshot,
  RoomStartResponse,
} from '@khalistra/shared/types';
import { RoomsService } from './rooms.service';
import type { CreateRoomDto, JoinRoomDto, StartRoomDto } from './dto';

type MatchEnvelope = RealtimeSnapshotEnvelope<GameStateSnapshot>;

const assertCodename = (codename?: string) => {
  if (!codename || !codename.trim()) {
    throw new BadRequestException('Codinome é obrigatório.');
  }
};

const assertSecret = (secret?: string) => {
  if (!secret || !secret.trim()) {
    throw new BadRequestException('Token do anfitrião é obrigatório.');
  }
};

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async createRoom(@Body() body: CreateRoomDto): Promise<RoomHandshakePayload> {
    assertCodename(body.codename);
    return this.roomsService.createRoom({ codename: body.codename });
  }

  @Post(':code/join')
  async joinRoom(
    @Param('code') code: string,
    @Body() body: JoinRoomDto,
  ): Promise<RoomHandshakePayload> {
    assertCodename(body.codename);
    return this.roomsService.joinRoom(code, { codename: body.codename });
  }

  @Get(':code')
  async getRoom(@Param('code') code: string): Promise<RoomSnapshot> {
    return this.roomsService.getRoom(code);
  }

  @Post(':code/start')
  async startMatch(
    @Param('code') code: string,
    @Body() body: StartRoomDto,
  ): Promise<RoomStartResponse<MatchEnvelope>> {
    assertSecret(body.secret);
    return this.roomsService.startMatch(code, body.secret);
  }
}
