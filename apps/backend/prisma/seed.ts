import { PrismaClient } from '@prisma/client';
import { createInitialState, type GameStateSnapshot, type PlayerId } from '@khalistra/game-engine';
import type { InputJsonValue } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

const PLAYERS: Array<{ id: PlayerId; alias: string }> = [
  { id: 'player-a', alias: 'Ordem Solar' },
  { id: 'player-b', alias: 'Círculo Umbral' },
];

const DEMO_MATCH_ID = 'demo-classic';

const serializeSnapshot = (state: GameStateSnapshot): InputJsonValue =>
  state as unknown as InputJsonValue;

async function seed() {
  await prisma.moveRecord.deleteMany();
  await prisma.matchSnapshot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.room.deleteMany();
  await prisma.player.deleteMany();

  await Promise.all(
    PLAYERS.map((player) =>
      prisma.player.create({
        data: {
          id: player.id,
          alias: player.alias,
        },
      }),
    ),
  );

  const state = createInitialState({
    matchId: DEMO_MATCH_ID,
    players: [PLAYERS[0].id, PLAYERS[1].id],
  });

  await prisma.match.create({
    data: {
      id: DEMO_MATCH_ID,
      lightPlayerId: PLAYERS[0].id,
      shadowPlayerId: PLAYERS[1].id,
      status: state.status,
      activePlayerId: state.activePlayer,
      turn: state.turn,
      snapshots: {
        create: {
          turn: state.turn,
          kind: 'INIT',
          state: serializeSnapshot(state),
        },
      },
    },
  });
}

void seed()
  .catch((error: unknown) => {
    console.error('[prisma:seed] Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
