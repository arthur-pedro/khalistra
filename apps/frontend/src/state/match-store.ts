'use client';

import { create } from 'zustand';
import { listLegalMoves, type GameStateSnapshot, type LegalMove, type PlayerId, type Vector2 } from '@khalistra/game-engine';
import type { MatchEnvelope } from '../lib/api';
import { createMatch, submitMove } from '../lib/api';
import { getMatchRealtimeClient } from '../lib/realtime/match-channel';

const DEFAULT_PLAYERS: [PlayerId, PlayerId] = ['ritualist-aurora', 'ritualist-umbra'];

const computeLegalMoves = (state?: GameStateSnapshot, pieceId?: string): LegalMove[] => {
  if (!state || !pieceId) {
    return [];
  }

  const piece = state.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece || piece.ownerId !== state.activePlayer) {
    return [];
  }

  return listLegalMoves(state, pieceId);
};

const createBaseState = () => ({
  matchId: undefined as string | undefined,
  state: undefined as GameStateSnapshot | undefined,
  event: undefined as MatchEnvelope['event'] | undefined,
  loading: false,
  submitting: false,
  error: undefined as string | undefined,
  selectedPieceId: undefined as string | undefined,
  legalMoves: [] as LegalMove[],
  players: DEFAULT_PLAYERS as [PlayerId, PlayerId],
  localPlayerId: undefined as PlayerId | undefined
});

interface MatchStore extends ReturnType<typeof createBaseState> {
  spawnMatch: () => Promise<void>;
  ingestMatch: (payload: MatchEnvelope) => void;
  selectPiece: (pieceId?: string) => void;
  submitMove: (pieceId: string, target: Vector2) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
  setLocalPlayer: (playerId?: PlayerId) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  ...createBaseState(),
  spawnMatch: async () => {
    const players = get().players;
    set({ loading: true, error: undefined, selectedPieceId: undefined, legalMoves: [] });
    try {
      const payload = await createMatch(players);
      get().ingestMatch(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar a partida.';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },
  ingestMatch: (payload) => {
    set((state) => {
      const nextSelected = state.selectedPieceId &&
        payload.state.pieces.some((piece) => piece.id === state.selectedPieceId && piece.ownerId === payload.state.activePlayer)
        ? state.selectedPieceId
        : undefined;

      return {
        matchId: payload.matchId,
        state: payload.state,
        event: payload.event,
        selectedPieceId: nextSelected,
        legalMoves: computeLegalMoves(payload.state, nextSelected),
        players: payload.state.players
      };
    });
  },
  selectPiece: (pieceId) => {
    const { state } = get();
    const nextPiece = pieceId && state?.pieces.some((piece) => piece.id === pieceId && piece.ownerId === state.activePlayer)
      ? pieceId
      : undefined;

    set({
      selectedPieceId: nextPiece,
      legalMoves: computeLegalMoves(state, nextPiece)
    });
  },
  submitMove: async (pieceId, target) => {
    const matchId = get().matchId;
    const actorId = get().localPlayerId ?? get().players[0];
    if (!matchId) {
      return;
    }

    set({ submitting: true, error: undefined });
    try {
      let payload: MatchEnvelope | undefined;
      const realtime = getMatchRealtimeClient();

      if (realtime) {
        try {
          payload = await realtime.submitMove(matchId, { pieceId, to: target }, actorId);
        } catch (error) {
          console.warn('Falha no envio realtime, tentando fallback HTTP.', error);
        }
      }

      if (!payload) {
        payload = await submitMove(matchId, { pieceId, to: target });
      }

      get().ingestMatch(payload);
      set({ selectedPieceId: undefined, legalMoves: [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível aplicar o movimento.';
      set({ error: message });
    } finally {
      set({ submitting: false });
    }
  },
  clearError: () => set({ error: undefined }),
  setError: (message) => set({ error: message }),
  setLocalPlayer: (playerId) => set({ localPlayerId: playerId }),
  reset: () => set({ ...createBaseState() })
}));

export const DEFAULT_FRONTEND_PLAYERS = DEFAULT_PLAYERS;
