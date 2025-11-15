import { randomUUID } from 'node:crypto';
import type { PlayerId } from '@khalistra/game-engine';

type SnapshotKind = 'INIT' | 'RUNTIME';
type SerializableState = Record<string, unknown>;

type StoredSnapshot = {
  matchId: string;
  turn: number;
  state: SerializableState;
  kind: SnapshotKind;
  createdAt: Date;
};

type MatchRow = {
  id: string;
  lightPlayerId: string;
  shadowPlayerId: string;
  status: string;
  activePlayerId: string;
  turn: number;
  winnerId?: string | null;
};

type MatchCreateInput = MatchRow & {
  snapshots?: {
    create?: {
      turn: number;
      kind: SnapshotKind;
      state: SerializableState;
    };
  };
};

type MatchUpdateInput = Partial<Pick<MatchRow, 'status' | 'activePlayerId' | 'winnerId' | 'turn'>>;

type RoomStatus = 'WAITING' | 'READY' | 'IN_MATCH' | 'CLOSED' | 'EXPIRED';

type RoomRow = {
  id: string;
  code: string;
  status: RoomStatus;
  matchId?: string | null;
  hostPlayerId: string;
  guestPlayerId?: string | null;
  hostDisplayName: string;
  guestDisplayName?: string | null;
  hostSecret: string;
  guestSecret?: string | null;
  hostJoinedAt: Date;
  guestJoinedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

export class InMemoryPrismaService {
  private readonly players = new Map<string, { id: string }>();
  private readonly matches = new Map<string, MatchRow>();
  private readonly snapshots = new Map<string, StoredSnapshot[]>();
  private readonly rooms = new Map<string, RoomRow>();

  readonly player = {
    findMany: ({ where }: { where: { id: { in: string[] } } }) =>
      Promise.resolve(where.id.in.filter((id) => this.players.has(id)).map((id) => ({ id }))),
    create: ({ data }: { data: { id: string } }) => {
      this.players.set(data.id, { id: data.id });
      return Promise.resolve({ id: data.id });
    },
  };

  readonly match = {
    findUnique: ({ where }: { where: { id: string } }) =>
      Promise.resolve(this.matches.get(where.id) ?? null),
    create: ({ data }: { data: MatchCreateInput }) => {
      const record: MatchRow = {
        id: data.id,
        lightPlayerId: data.lightPlayerId,
        shadowPlayerId: data.shadowPlayerId,
        status: data.status,
        activePlayerId: data.activePlayerId,
        turn: data.turn,
        winnerId: data.winnerId ?? null,
      };
      this.matches.set(record.id, record);
      if (data.snapshots?.create) {
        const entry: StoredSnapshot = {
          matchId: record.id,
          turn: data.snapshots.create.turn,
          state: data.snapshots.create.state,
          kind: data.snapshots.create.kind,
          createdAt: new Date(),
        };
        this.snapshots.set(record.id, [entry]);
      }
      return Promise.resolve(record);
    },
    update: ({ where, data }: { where: { id: string }; data: MatchUpdateInput }) => {
      const match = this.matches.get(where.id);
      if (match) {
        Object.assign(match, data);
      }
      return Promise.resolve(match ?? null);
    },
    findMany: ({ where }: { where: { status: { not: string } } }) => {
      const items = Array.from(this.matches.values())
        .filter((match) => match.status !== where.status.not)
        .map((match) => ({ id: match.id }));
      return Promise.resolve(items);
    },
  };

  readonly matchSnapshot = {
    findFirst: ({ where }: { where: { matchId: string } }) => {
      const list = this.snapshots.get(where.matchId) ?? [];
      if (!list.length) {
        return Promise.resolve(null);
      }
      return Promise.resolve(list[list.length - 1]);
    },
    create: ({ data }: { data: Omit<StoredSnapshot, 'createdAt'> }) => {
      const entry: StoredSnapshot = { ...data, createdAt: new Date() };
      const list = this.snapshots.get(data.matchId) ?? [];
      list.push(entry);
      this.snapshots.set(data.matchId, list);
      return Promise.resolve(entry);
    },
  };

  readonly moveRecord = {
    create: () => Promise.resolve(undefined),
  };

  readonly room = {
    findUnique: ({ where }: { where: { code: string } }) => {
      const room = Array.from(this.rooms.values()).find((entry) => entry.code === where.code);
      return Promise.resolve(room ?? null);
    },
    create: ({
      data,
    }: {
      data: Partial<RoomRow> &
        Pick<RoomRow, 'code' | 'hostPlayerId' | 'hostDisplayName' | 'hostSecret' | 'expiresAt'>;
    }) => {
      const now = new Date();
      const record: RoomRow = {
        id: randomUUID(),
        code: data.code,
        status: data.status ?? 'WAITING',
        matchId: data.matchId ?? null,
        hostPlayerId: data.hostPlayerId,
        guestPlayerId: data.guestPlayerId ?? null,
        hostDisplayName: data.hostDisplayName,
        guestDisplayName: data.guestDisplayName ?? null,
        hostSecret: data.hostSecret,
        guestSecret: data.guestSecret ?? null,
        hostJoinedAt: data.hostJoinedAt ?? now,
        guestJoinedAt: data.guestJoinedAt ?? null,
        createdAt: now,
        updatedAt: now,
        expiresAt: data.expiresAt,
      };
      this.rooms.set(record.id, record);
      return Promise.resolve(record);
    },
    update: ({ where, data }: { where: { id: string }; data: Partial<RoomRow> }) => {
      const room = this.rooms.get(where.id);
      if (!room) {
        return Promise.resolve(null);
      }
      Object.assign(room, data);
      room.updatedAt = new Date();
      this.rooms.set(room.id, room);
      return Promise.resolve(room);
    },
    updateMany: ({ where, data }: { where: { matchId?: string }; data: Partial<RoomRow> }) => {
      let count = 0;
      this.rooms.forEach((room) => {
        if (where.matchId && room.matchId !== where.matchId) {
          return;
        }
        Object.assign(room, data);
        room.updatedAt = new Date();
        count += 1;
      });
      return Promise.resolve({ count });
    },
  };

  seedPlayers(players: PlayerId[]) {
    players.forEach((id) => {
      this.players.set(id, { id });
    });
  }
}
