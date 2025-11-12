import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { GameStateSnapshot, PieceState } from '@khalistra/game-engine';
import type { GameEvent } from '@khalistra/shared/types';

interface MatchResponse {
  matchId: string;
  state: GameStateSnapshot;
  event: GameEvent<'game:update'>;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const parsePayload = <T = unknown>(payload: string): T => JSON.parse(payload) as T;

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api');
    await app.init();
    const instance = app.getHttpAdapter().getInstance();
    if (typeof instance.ready === 'function') {
      await instance.ready();
    }
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', async () => {
    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/api',
    });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('Khalistra API online');
  });

  it('/api/matches lifecycle (POST -> POST move)', async () => {
    const players = ['player-a', 'player-b'];
    const fastify = app.getHttpAdapter().getInstance();
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/matches',
      payload: { players },
    });

    expect(createResponse.statusCode).toBe(201);

    const created = parsePayload<MatchResponse>(createResponse.payload);
    expect(created.matchId).toBeDefined();
    expect(created.state.players).toEqual(players);
    expect(created.event.name).toBe('game:update');

    const sentinel = created.state.pieces.find(
      (piece: PieceState) => piece.ownerId === players[0] && piece.type === 'sentinel',
    );
    if (!sentinel) {
      throw new Error('Sentinel não encontrado');
    }

    const moveResponse = await fastify.inject({
      method: 'POST',
      url: `/api/matches/${created.matchId}/moves`,
      payload: {
        pieceId: sentinel.id,
        to: { x: sentinel.position.x, y: sentinel.position.y + 1 },
      },
    });

    expect(moveResponse.statusCode).toBe(200);
    const moved = parsePayload<MatchResponse>(moveResponse.payload);
    expect(moved.state.turn).toBe(2);
    expect(moved.state.activePlayer).toBe(players[1]);
    expect(moved.event.name).toBe('game:update');
  });
});
