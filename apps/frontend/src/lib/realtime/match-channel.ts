'use client';

import { io, type Socket } from 'socket.io-client';
import type { MoveCommand, PlayerId } from '@khalistra/game-engine';
import type {
  GameEvent,
  GameRealtimeHandshakePayload,
  GameRealtimeMovePayload,
  GameRealtimeReplayPayload,
  GameSocketAck,
} from '@khalistra/shared/types';
import type { MatchEnvelope } from '../api';

type UpdateListener = (payload: MatchEnvelope) => void;
type FinishListener = (event: GameEvent<'game:finish'>) => void;
type ErrorListener = (error: Error) => void;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';
const DEFAULT_REALTIME_URL = API_BASE_URL.replace(/\/api$/, '');
const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? DEFAULT_REALTIME_URL;

class MatchRealtimeClient {
  private socket?: Socket;

  constructor(private readonly baseUrl: string) {}

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(this.baseUrl, {
      autoConnect: true,
      transports: ['websocket'],
      withCredentials: true,
    });
    return this.socket;
  }

  onUpdate(listener: UpdateListener) {
    const socket = this.ensureSocket();
    socket.on('game:update', listener);
    return () => socket.off('game:update', listener);
  }

  onFinish(listener: FinishListener) {
    const socket = this.ensureSocket();
    socket.on('game:finish', listener);
    return () => socket.off('game:finish', listener);
  }

  onError(listener: ErrorListener) {
    const socket = this.ensureSocket();
    const handler = (error: Error) => listener(error);
    socket.on('connect_error', handler);
    socket.on('error', handler);
    return () => {
      socket.off('connect_error', handler);
      socket.off('error', handler);
    };
  }

  onConnect(listener: () => void) {
    const socket = this.ensureSocket();
    socket.on('connect', listener);
    return () => socket.off('connect', listener);
  }

  onDisconnect(listener: () => void) {
    const socket = this.ensureSocket();
    socket.on('disconnect', listener);
    return () => socket.off('disconnect', listener);
  }

  async joinMatch(matchId: string, playerId?: PlayerId) {
    const payload: GameRealtimeHandshakePayload = { matchId, playerId };
    return this.emitWithAck<MatchEnvelope>('game:join', payload);
  }

  async requestReplay(matchId: string) {
    const payload: GameRealtimeReplayPayload = { matchId };
    return this.emitWithAck<MatchEnvelope>('game:replay', payload);
  }

  async submitMove(matchId: string, command: MoveCommand, playerId?: PlayerId) {
    const payload: GameRealtimeMovePayload<MoveCommand> = { matchId, command, playerId };
    return this.emitWithAck<MatchEnvelope>('game:move', payload);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  private ensureSocket() {
    return this.connect();
  }

  private emitWithAck<T>(event: string, payload: unknown) {
    const socket = this.ensureSocket();
    return new Promise<T>((resolve, reject) => {
      socket.emit(event, payload, (ack: GameSocketAck<T>) => {
        if (ack?.ok) {
          resolve(ack.data);
          return;
        }
        reject(new Error(ack?.error?.message ?? 'Falha ao processar evento realtime.'));
      });
    });
  }
}

let client: MatchRealtimeClient | null = null;

export const getMatchRealtimeClient = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!client) {
    client = new MatchRealtimeClient(REALTIME_URL);
  }

  return client;
};
