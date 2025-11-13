'use client';

import { useEffect } from 'react';
import type { MatchEnvelope } from '../api';
import { createMatchPollingChannel } from './match-channel';

interface UseMatchChannelOptions {
  matchId?: string;
  enabled?: boolean;
  intervalMs?: number;
  onSnapshot: (payload: MatchEnvelope) => void;
  onError?: (error: Error) => void;
}

export const useMatchChannel = ({ matchId, enabled = true, intervalMs, onSnapshot, onError }: UseMatchChannelOptions) => {
  useEffect(() => {
    if (!matchId || !enabled) {
      return;
    }

    const channel = createMatchPollingChannel({ matchId, intervalMs, onSnapshot, onError });
    return () => {
      channel.close();
    };
  }, [matchId, enabled, intervalMs, onSnapshot, onError]);
};
