import type { PlayerId } from '@khalistra/game-engine';
import { MatchesService } from './matches.service';
import { InMemoryPrismaService } from '../testing/in-memory-prisma';
import { InMemoryRedisService } from '../testing/in-memory-redis';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const PLAYERS: [PlayerId, PlayerId] = ['player-a', 'player-b'];

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: InMemoryPrismaService;
  let redis: InMemoryRedisService;

  beforeEach(async () => {
    prisma = new InMemoryPrismaService();
    prisma.seedPlayers(PLAYERS);
    redis = new InMemoryRedisService();
    service = new MatchesService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
    await service.onModuleInit();
  });

  it('creates and stores a new match state', async () => {
    const state = await service.createMatch({
      matchId: 'match-1',
      players: PLAYERS,
    });

    expect(state.matchId).toBe('match-1');
    expect(state.history).toHaveLength(0);
    expect(state.players).toEqual(PLAYERS);
    await expect(service.getMatchState('match-1')).resolves.toHaveProperty('matchId', 'match-1');
  });

  it('applies moves sequentially using the engine', async () => {
    const state = await service.createMatch({
      matchId: 'match-2',
      players: PLAYERS,
    });
    const activePiece = state.pieces.find(
      (piece) => piece.ownerId === PLAYERS[0] && piece.type === 'pawn',
    );
    if (!activePiece) {
      throw new Error('Sentinel não encontrado');
    }

    const updated = await service.submitMove('match-2', {
      pieceId: activePiece.id,
      to: { x: activePiece.position.x, y: activePiece.position.y + 1 },
    });

    expect(updated.turn).toBe(state.turn + 1);
    expect(updated.history).toHaveLength(1);
    expect(updated.pieces.find((piece) => piece.id === activePiece.id)?.position).toEqual({
      x: activePiece.position.x,
      y: activePiece.position.y + 1,
    });
    expect(updated.activePlayer).toBe(PLAYERS[1]);
  });
});
