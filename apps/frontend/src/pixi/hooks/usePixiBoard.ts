'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameStateSnapshot, LegalMove } from '@khalistra/game-engine';
import type { PixiBoardRenderer } from '../types';
import { createBoardRenderer } from '../factories/createBoardRenderer';

interface UsePixiBoardProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  state?: GameStateSnapshot;
  legalMoves: LegalMove[];
  selectedPieceId?: string;
  disabled?: boolean;
  onSelectPiece: (pieceId?: string) => void;
  onSubmitMove: (pieceId: string, target: { x: number; y: number }) => void;
}

export const usePixiBoard = ({
  containerRef,
  state,
  legalMoves,
  selectedPieceId,
  disabled,
  onSelectPiece,
  onSubmitMove
}: UsePixiBoardProps) => {
  const rendererRef = useRef<PixiBoardRenderer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const bootstrap = async () => {
      try {
        rendererRef.current = await createBoardRenderer({
          container,
          onSelectPiece,
          onSubmitMove
        });
        setReady(true);
      } catch (error) {
        console.error('[PixiBoard] Falha ao inicializar PixiJS', error);
      }
    };

    void bootstrap();

    return () => {
      setReady(false);
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [containerRef, onSelectPiece, onSubmitMove]);

  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }

    rendererRef.current.sync({
      state,
      legalMoves,
      selectedPieceId,
      disabled
    });
  }, [state, legalMoves, selectedPieceId, disabled]);

  return { ready };
};
