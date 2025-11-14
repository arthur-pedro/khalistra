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

export class InMemoryPrismaService {
  private readonly players = new Map<string, { id: string }>();
  private readonly matches = new Map<string, MatchRow>();
  private readonly snapshots = new Map<string, StoredSnapshot[]>();

  readonly player = {
    findMany: ({ where }: { where: { id: { in: string[] } } }) =>
      Promise.resolve(where.id.in.filter((id) => this.players.has(id)).map((id) => ({ id }))),
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

  seedPlayers(players: PlayerId[]) {
    players.forEach((id) => {
      this.players.set(id, { id });
    });
  }
}
