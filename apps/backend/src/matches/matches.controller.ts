import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { stateToUpdateEvent, type MoveCommand, type PlayerId } from '@khalistra/game-engine';
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

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  createMatch(@Body() body: CreateMatchDto) {
    const matchId = body.matchId ?? randomUUID();
    const players = toPlayerTuple(body.players);
    const state = this.matchesService.createMatch({ matchId, players });

    return this.buildResponse(state);
  }

  @Get(':matchId')
  getMatch(@Param('matchId') matchId: string) {
    const state = this.matchesService.getMatchState(matchId);
    return this.buildResponse(state);
  }

  @Post(':matchId/moves')
  @HttpCode(200)
  submitMove(@Param('matchId') matchId: string, @Body() body: SubmitMoveDto) {
    if (assertMovePayload(body)) {
      const command: MoveCommand = {
        pieceId: body.pieceId,
        to: body.to,
        ritualCard: body.ritualCard,
      };

      const state = this.matchesService.submitMove(matchId, command);
      return this.buildResponse(state);
    }

    throw new BadRequestException('Payload inválido.');
  }

  private buildResponse(state: ReturnType<MatchesService['getMatchState']>) {
    return {
      matchId: state.matchId,
      state,
      event: stateToUpdateEvent(state),
    };
  }
}
