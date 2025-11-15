import { BadRequestException } from '@nestjs/common';
import { createInitialState, type PlayerId } from '@khalistra/game-engine';
import { RoomsService } from './rooms.service';
import { InMemoryPrismaService } from '../testing/in-memory-prisma';
import { PrismaService } from '../prisma/prisma.service';
import type { MatchesService } from '../matches/matches.service';

class FakeMatchesService {
  createMatch(payload: { matchId: string; players: [PlayerId, PlayerId] }) {
    return Promise.resolve(createInitialState(payload));
  }
}

describe('RoomsService', () => {
  let prisma: InMemoryPrismaService;
  let matches: FakeMatchesService;
  let service: RoomsService;

  beforeEach(() => {
    prisma = new InMemoryPrismaService();
    matches = new FakeMatchesService();
    service = new RoomsService(
      prisma as unknown as PrismaService,
      matches as unknown as MatchesService,
    );
  });

  it('creates a room, accepts a guest and starts a match', async () => {
    const host = await service.createRoom({ codename: 'Ordem Solar' });
    expect(host.room.status).toBe('waiting');
    expect(host.seat).toBe('host');

    const guest = await service.joinRoom(host.room.code, { codename: 'Círculo Umbral' });
    expect(guest.room.host.codename).toBe('Ordem Solar');
    expect(guest.room.guest?.codename).toBe('Círculo Umbral');
    expect(guest.room.status).toBe('ready');

    const start = await service.startMatch(host.room.code, host.secret);
    expect(start.room.status).toBe('in-match');
    expect(start.match.matchId).toContain(host.room.code.toLowerCase());
    expect(start.match.state.players).toHaveLength(2);
  });

  it('marks a room as expired when TTL is reached', async () => {
    const host = await service.createRoom({ codename: 'Guardião' });
    const persisted = await prisma.room.findUnique({ where: { code: host.room.code } });
    if (!persisted) {
      throw new Error('Sala não persistida');
    }

    await prisma.room.update({
      where: { id: persisted.id },
      data: { expiresAt: new Date(Date.now() - 1) },
    });

    await expect(service.joinRoom(host.room.code, { codename: 'Visitante' })).rejects.toThrow(
      BadRequestException,
    );

    const snapshot = await service.getRoom(host.room.code);
    expect(snapshot.status).toBe('expired');
  });
});
