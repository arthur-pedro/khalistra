export type RoomSeat = 'host' | 'guest';

export type RoomStatus = 'waiting' | 'ready' | 'in-match' | 'closed' | 'expired';

export interface RoomParticipant {
  seat: RoomSeat;
  playerId: string;
  codename: string;
  joinedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  createdAt: string;
  expiresAt: string;
  host: RoomParticipant;
  guest?: RoomParticipant;
  matchId?: string;
}

export interface RoomHandshakePayload {
  room: RoomSnapshot;
  seat: RoomSeat;
  secret: string;
}

export interface RoomStartResponse<Snapshot = unknown> {
  room: RoomSnapshot;
  match: Snapshot;
}
