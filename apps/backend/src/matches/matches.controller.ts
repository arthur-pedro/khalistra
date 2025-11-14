import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  stateToUpdateEvent,
  type GameStateSnapshot,
  type MoveCommand,
  type PlayerId,
} from '@khalistra/game-engine';
import type { RealtimeSnapshotEnvelope } from '@khalistra/shared/types';
import { MatchesService } from './matches.service';
import type { CreateMatchDto, SubmitMoveDto } from './dto';

const toPlayerTuple = (players?: PlayerId[]): [PlayerId, PlayerId] => {
  if (!Array.isArray(players) || players.length !== 2) {
    throw new BadRequestException('Uma partida precisa de exatamente dois jogadores.');
  }

  const [first, second] = players;
  if (!isValidPlayer(first) || !isValidPlayer(second)) {
    throw new BadRequestException('IDs de jogador são obrigatórios.');
  }

  return [first, second];
};

const isValidPlayer = (playerId: PlayerId | undefined): playerId is PlayerId =>
  typeof playerId === 'string' && playerId.trim().length > 0;

const assertMovePayload = (payload: SubmitMoveDto): payload is Required<SubmitMoveDto> => {
  if (!payload.pieceId || !payload.to) {
    throw new BadRequestException('Campos pieceId e to são obrigatórios.');
  }

  if (typeof payload.to.x !== 'number' || typeof payload.to.y !== 'number') {
    throw new BadRequestException('Coordenadas do destino devem ser numéricas.');
  }

  return true;
};

type MatchEnvelope = RealtimeSnapshotEnvelope<GameStateSnapshot>;

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  async createMatch(@Body() body: CreateMatchDto): Promise<MatchEnvelope> {
    const matchId = body.matchId ?? randomUUID();
    const players = toPlayerTuple(body.players);
    const state = await this.matchesService.createMatch({ matchId, players });

    return this.buildResponse(state);
  }

  @Get(':matchId')
  async getMatch(@Param('matchId') matchId: string): Promise<MatchEnvelope> {
    const state = await this.matchesService.getMatchState(matchId);
    return this.buildResponse(state);
  }

  @Post(':matchId/moves')
  @HttpCode(200)
  async submitMove(
    @Param('matchId') matchId: string,
    @Body() body: SubmitMoveDto,
  ): Promise<MatchEnvelope> {
    if (assertMovePayload(body)) {
      const command: MoveCommand = {
        pieceId: body.pieceId,
        to: body.to,
        ritualCard: body.ritualCard,
        promoteTo: body.promoteTo,
      };

      const state = await this.matchesService.submitMove(matchId, command);
      return this.buildResponse(state);
    }

    throw new BadRequestException('Payload inválido.');
  }

  private buildResponse(state: GameStateSnapshot): MatchEnvelope {
    return {
      matchId: state.matchId,
      state,
      event: stateToUpdateEvent(state),
    };
  }
}
