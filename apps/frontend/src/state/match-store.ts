import { create } from 'zustand';
import { listLegalMoves, type GameStateSnapshot, type LegalMove, type PlayerId, type Vector2 } from '@khalistra/game-engine';
import type { MatchEnvelope } from '../lib/api';
import { createMatch, submitMove } from '../lib/api';

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

interface MatchStore {
  matchId?: string;
  state?: GameStateSnapshot;
  event?: MatchEnvelope['event'];
  loading: boolean;
  submitting: boolean;
  error?: string;
  selectedPieceId?: string;
  legalMoves: LegalMove[];
  players: [PlayerId, PlayerId];
  spawnMatch: () => Promise<void>;
  ingestMatch: (payload: MatchEnvelope) => void;
  selectPiece: (pieceId?: string) => void;
  submitMove: (pieceId: string, target: Vector2) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchId: undefined,
  state: undefined,
  event: undefined,
  loading: false,
  submitting: false,
  error: undefined,
  selectedPieceId: undefined,
  legalMoves: [],
  players: DEFAULT_PLAYERS,
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
        legalMoves: computeLegalMoves(payload.state, nextSelected)
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
    if (!matchId) {
      return;
    }

    set({ submitting: true, error: undefined });
    try {
      const payload = await submitMove(matchId, { pieceId, to: target });
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
  setError: (message) => set({ error: message })
}));

export const DEFAULT_FRONTEND_PLAYERS = DEFAULT_PLAYERS;
