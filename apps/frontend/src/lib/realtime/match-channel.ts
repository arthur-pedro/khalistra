import type { MatchEnvelope } from '../api';
import { fetchMatch } from '../api';

export interface MatchChannel {
  close: () => void;
}

export interface MatchChannelOptions {
  matchId: string;
  intervalMs?: number;
  onSnapshot: (payload: MatchEnvelope) => void;
  onError?: (error: Error) => void;
}

export const createMatchPollingChannel = ({ matchId, intervalMs = 4000, onSnapshot, onError }: MatchChannelOptions): MatchChannel => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const tick = async () => {
    if (closed) {
      return;
    }

    try {
      const payload = await fetchMatch(matchId);
      onSnapshot(payload);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      if (!closed) {
        timer = setTimeout(tick, intervalMs);
      }
    }
  };

  void tick();

  return {
    close: () => {
      closed = true;
      if (timer) {
        clearTimeout(timer);
      }
    }
  };
};
