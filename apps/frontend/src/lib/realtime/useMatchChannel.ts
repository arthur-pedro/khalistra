'use client';

import { useEffect, useRef } from 'react';
import type { PlayerId } from '@khalistra/game-engine';
import type { MatchEnvelope } from '../api';
import { getMatchRealtimeClient } from './match-channel';

interface UseMatchChannelOptions {
  matchId?: string;
  enabled?: boolean;
  playerId?: PlayerId;
  onSnapshot: (payload: MatchEnvelope) => void;
  onError?: (error: Error) => void;
}

export const useMatchChannel = ({ matchId, enabled = true, playerId, onSnapshot, onError }: UseMatchChannelOptions) => {
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

    const client = getMatchRealtimeClient();
    if (!client) {
      errorRef.current?.(new Error('Canal realtime indisponível.'));
      return;
    }

    client.connect();

    const offUpdate = client.onUpdate((payload) => {
      if (payload.matchId === matchId) {
        snapshotRef.current(payload);
      }
    });

    const offError = client.onError((error) => {
      errorRef.current?.(error);
    });

    const offConnect = client.onConnect(() => {
      void client
        .requestReplay(matchId)
        .then((payload) => snapshotRef.current(payload))
        .catch((error) => errorRef.current?.(error as Error));
    });

    void client
      .joinMatch(matchId, playerId)
      .then((payload) => snapshotRef.current(payload))
      .catch((error) => errorRef.current?.(error as Error));

    return () => {
      offUpdate?.();
      offError?.();
      offConnect?.();
    };
  }, [matchId, enabled, playerId]);
};
