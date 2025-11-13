'use client';

import { memo, useRef } from 'react';
import type { GameStateSnapshot, LegalMove, Vector2 } from '@khalistra/game-engine';
import { usePixiBoard } from '../pixi/hooks/usePixiBoard';

interface MatchBoardProps {
  state?: GameStateSnapshot;
  selectedPieceId?: string;
  legalMoves: LegalMove[];
  disabled?: boolean;
  onSelectPiece: (pieceId?: string) => void;
  onSubmitMove: (pieceId: string, target: Vector2) => void;
}

const MatchBoardComponent = ({
  state,
  selectedPieceId,
  legalMoves,
  disabled,
  onSelectPiece,
  onSubmitMove
}: MatchBoardProps) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { ready } = usePixiBoard({
    containerRef: canvasRef,
    state,
    legalMoves,
    selectedPieceId,
    disabled,
    onSelectPiece,
    onSubmitMove
  });

  return (
    <div className="space-y-2">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/50">
        <div
          ref={canvasRef}
          className="relative aspect-square w-full rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(0,0,0,0.4))]"
        >
          {!ready && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
              <span>Inicializando tabuleiro ritual</span>
              <span className="text-[var(--color-ember-strong)]">PixiJS</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Colunas: a-h</span>
        <span>Linhas: 1-8 (base branca)</span>
      </div>
    </div>
  );
};

export const MatchBoard = memo(MatchBoardComponent);
