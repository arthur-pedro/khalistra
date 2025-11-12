import type { GameStateSnapshot, MoveCommand, PlayerId } from '@khalistra/game-engine';
import type { GameEvent } from '@khalistra/shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export interface MatchEnvelope {
  matchId: string;
  state: GameStateSnapshot;
  event: GameEvent<'game:update'>;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const rawPayload = await response.text();
    try {
      const parsed = JSON.parse(rawPayload) as { message?: string };
      throw new Error(parsed?.message || 'Falha ao comunicar com a API do Khalistra.');
    } catch {
      throw new Error(rawPayload || 'Falha ao comunicar com a API do Khalistra.');
    }
  }

  return (await response.json()) as T;
};

export const createMatch = (players: [PlayerId, PlayerId]): Promise<MatchEnvelope> =>
  request('/matches', {
    method: 'POST',
    body: JSON.stringify({ players })
  });

export const fetchMatch = (matchId: string): Promise<MatchEnvelope> => request(`/matches/${matchId}`);

export const submitMove = (matchId: string, payload: MoveCommand): Promise<MatchEnvelope> =>
  request(`/matches/${matchId}/moves`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
