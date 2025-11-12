'use client';

import { memo, useMemo } from 'react';
import type { GameStateSnapshot, LegalMove, PieceState, Vector2 } from '@khalistra/game-engine';

const PIECE_SYMBOLS: Record<PieceState['type'], string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: 'P'
};

const tileKey = (position: Vector2) => `${position.x}-${position.y}`;

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
  const boardSize = state?.boardSize ?? 8;

  const pieceByTile = useMemo(() => {
    const map = new Map<string, PieceState>();
    state?.pieces.forEach((piece) => map.set(tileKey(piece.position), piece));
    return map;
  }, [state?.pieces]);

  const legalTargets = useMemo(() => new Set(legalMoves.map((move) => tileKey(move.to))), [legalMoves]);
  const captureTargets = useMemo(
    () => new Set(legalMoves.filter((move) => move.capture).map((move) => tileKey(move.to))),
    [legalMoves]
  );

  const lastMove = state?.history.at(-1);
  const lastMoveKeys = useMemo(() => {
    if (!lastMove) {
      return new Set<string>();
    }
    return new Set<string>([tileKey(lastMove.from), tileKey(lastMove.to)]);
  }, [lastMove]);

  const checkedTile = (() => {
    if (!state?.checkedPlayerId) {
      return undefined;
    }
    const king = state.pieces.find(
      (piece) => piece.ownerId === state.checkedPlayerId && piece.type === 'king'
    );
    return king ? tileKey(king.position) : undefined;
  })();

  const isInteractable = Boolean(state) && state?.status !== 'completed' && !disabled;

  const handleSquareClick = (position: Vector2) => {
    if (!state) {
      return;
    }

    const key = tileKey(position);
    const occupant = pieceByTile.get(key);

    if (selectedPieceId && legalTargets.has(key) && isInteractable) {
      onSubmitMove(selectedPieceId, position);
      return;
    }

    if (
      occupant &&
      occupant.ownerId === state.activePlayer &&
      state.status !== 'completed' &&
      !disabled
    ) {
      onSelectPiece(occupant.id);
      return;
    }

    onSelectPiece(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-1 rounded-3xl border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/50">
        {Array.from({ length: boardSize })
          .map((_, rowIndex) => rowIndex)
          .reverse()
          .map((y) => (
            <div key={y} className="grid grid-cols-8 gap-1">
              {Array.from({ length: boardSize }, (_, x) => ({ x, y })).map((position) => {
                const key = tileKey(position);
                const occupant = pieceByTile.get(key);
                const isDark = (position.x + position.y) % 2 === 1;
                const isSelected = occupant?.id === selectedPieceId;
                const isLegalTarget = legalTargets.has(key);
                const isCapture = captureTargets.has(key);
                const isLastMove = lastMoveKeys.has(key);
                const isChecked = checkedTile === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSquareClick(position)}
                    disabled={!state || disabled}
                    className={[
                      'relative aspect-square rounded-2xl border text-left transition',
                      isDark ? 'border-white/5 bg-white/5' : 'border-white/5 bg-white/10',
                      isSelected ? 'ring-2 ring-[var(--color-ember-strong)]' : '',
                      isLastMove ? 'after:absolute after:inset-1 after:rounded-2xl after:border after:border-white/30' : '',
                      isChecked ? 'outline outline-2 outline-rose-500' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {occupant && (
                      <span
                        className={[
                          'absolute inset-0 flex items-center justify-center text-xl font-semibold drop-shadow-lg',
                          occupant.ownerId === state?.players[0]
                            ? 'text-[var(--color-ember-strong)]'
                            : 'text-[var(--color-aether)]'
                        ].join(' ')}
                      >
                        {PIECE_SYMBOLS[occupant.type]}
                      </span>
                    )}
                    {isLegalTarget && (
                      <span
                        className={[
                          'absolute inset-0 flex items-center justify-center',
                          isCapture ? 'text-rose-400' : 'text-white'
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'block rounded-full',
                            isCapture ? 'h-5 w-5 border-2 border-current' : 'h-4 w-4 bg-current/50'
                          ].join(' ')}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
      </div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Colunas: a-h</span>
        <span>Linhas: 1-8 (base branca)</span>
      </div>
    </div>
  );
};

export const MatchBoard = memo(MatchBoardComponent);
