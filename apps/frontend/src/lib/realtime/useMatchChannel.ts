'use client';

import { useEffect, useRef } from 'react';
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
  const snapshotRef = useRef(onSnapshot);
  const errorRef = useRef(onError);

  useEffect(() => {
    snapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!matchId || !enabled) {
      return;
    }

    const channel = createMatchPollingChannel({
      matchId,
      intervalMs,
      onSnapshot: (payload) => {
        snapshotRef.current(payload);
      },
      onError: (error) => {
        errorRef.current?.(error);
      }
    });
    return () => {
      channel.close();
    };
  }, [matchId, enabled, intervalMs]);
};
