'use client';

import { create } from 'zustand';
import type { RoomHandshakePayload, RoomSeat, RoomSnapshot } from '@khalistra/shared/types';
import type { MatchEnvelope } from '../lib/api';
import {
  createRoomSession,
  fetchRoomSnapshot,
  joinRoomSession,
  startRoomSessionMatch
} from '../lib/rooms/api';

export type RoomView = 'menu' | 'create' | 'join' | 'lobby' | 'match';

interface RoomStore {
  view: RoomView;
  room?: RoomSnapshot;
  seat?: RoomSeat;
  secret?: string;
  loading: boolean;
  error?: string;
  setView: (view: RoomView) => void;
  clearError: () => void;
  createRoom: (codename: string) => Promise<void>;
  joinRoom: (code: string, codename: string) => Promise<void>;
  refreshRoom: () => Promise<void>;
  startMatch: () => Promise<MatchEnvelope | undefined>;
  setRoom: (snapshot: RoomSnapshot) => void;
  reset: () => void;
}

const getMessage = (error: unknown) => (error instanceof Error ? error.message : 'Falha ao comunicar com a sala.');

const fromHandshake = (payload: RoomHandshakePayload, view: RoomView): Pick<RoomStore, 'room' | 'seat' | 'secret' | 'view'> => ({
  room: payload.room,
  seat: payload.seat,
  secret: payload.secret,
  view
});

export const useRoomStore = create<RoomStore>((set, get) => ({
  view: 'menu',
  room: undefined,
  seat: undefined,
  secret: undefined,
  loading: false,
  error: undefined,
  setView: (view) => set({ view, error: undefined }),
  clearError: () => set({ error: undefined }),
  createRoom: async (codename) => {
    set({ loading: true, error: undefined });
    try {
      const payload = await createRoomSession({ codename });
      set({ ...fromHandshake(payload, 'lobby'), loading: false });
    } catch (error) {
      set({ error: getMessage(error), loading: false });
    }
  },
  joinRoom: async (code, codename) => {
    set({ loading: true, error: undefined });
    try {
      const payload = await joinRoomSession(code, { codename });
      set({ ...fromHandshake(payload, 'lobby'), loading: false });
    } catch (error) {
      set({ error: getMessage(error), loading: false });
    }
  },
  refreshRoom: async () => {
    const code = get().room?.code;
    if (!code) {
      return;
    }
    try {
      const snapshot = await fetchRoomSnapshot(code);
      const currentView = get().view;
      const nextView = snapshot.status === 'in-match' ? 'match' : currentView;
      set({ room: snapshot, view: nextView });
    } catch (error) {
      set({ error: getMessage(error) });
    }
  },
  startMatch: async () => {
    const { room, seat, secret } = get();
    if (!room || seat !== 'host' || !secret) {
      set({ error: 'Apenas o anfitrião pode iniciar o ritual.' });
      return undefined;
    }

    set({ loading: true, error: undefined });
    try {
      const payload = await startRoomSessionMatch(room.code, secret);
      set({ room: payload.room, view: 'match', loading: false });
      return payload.match;
    } catch (error) {
      const message = getMessage(error);
      set({ error: message, loading: false });
      return undefined;
    }
  },
  setRoom: (snapshot) => {
    const nextView = snapshot.status === 'in-match' ? 'match' : get().view;
    set({ room: snapshot, view: nextView });
  },
  reset: () => set({
    view: 'menu',
    room: undefined,
    seat: undefined,
    secret: undefined,
    loading: false,
    error: undefined
  })
}));
