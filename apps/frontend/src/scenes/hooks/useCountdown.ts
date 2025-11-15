'use client';

import { useEffect, useState } from 'react';

export interface CountdownState {
  label: string;
  expired: boolean;
}

export const useCountdown = (expiresAt?: string): CountdownState => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) {
    return { label: 'Sem limite', expired: false };
  }

  const distance = new Date(expiresAt).getTime() - now;

  if (distance <= 0) {
    return { label: 'Tempo esgotado', expired: true };
  }

  const minutes = Math.floor(distance / 60000);
  const seconds = Math.floor((distance % 60000) / 1000)
    .toString()
    .padStart(2, '0');

  return {
    label: `${minutes}m ${seconds}s`,
    expired: false
  };
};

