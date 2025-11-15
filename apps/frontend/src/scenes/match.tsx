'use client';

import { useMemo } from 'react';
import type { GameStatus, MoveRecord } from '@khalistra/game-engine';
import { MatchBoard } from '../components/board';
import { SceneButton, SceneGrid, ScenePanel, SceneTag } from './components';
import { useMatchStore } from '../state/match-store';
import { useRoomStore } from '../state/room-store';

const statusLabels: Record<GameStatus, string> = {
  awaiting: 'Aguardando conexão',
  'in-progress': 'Duelo em andamento',
  check: 'Xeque declarado',
  ritual: 'Ritual extraordinário',
  completed: 'Ritual concluído'
};

const formatSquare = (position: { x: number; y: number }) => `${String.fromCharCode(97 + position.x)}${position.y + 1}`;

const describeMove = (record: MoveRecord) => {
  const [, pieceType = record.pieceId] = record.pieceId.split('.');
  const captureMarker = record.capturedPieceType ? 'x' : '→';
  const promotion = record.promotion ? ` (promoção: ${record.promotion})` : '';
  const suffix = record.checkmate ? ' #final' : record.check ? ' +xeque' : '';
  return `${pieceType.toUpperCase()} ${captureMarker} ${formatSquare(record.to)}${promotion}${suffix}`;
};

const resolveCodename = (playerId: string, room?: ReturnType<typeof useRoomStore.getState>['room']) => {
  if (!room) {
    return playerId;
  }
  if (room.host.playerId === playerId) {
    return room.host.codename;
  }
  if (room.guest?.playerId === playerId) {
    return room.guest.codename;
  }
  return playerId;
};

interface MatchSceneProps {
  onLeave: () => void;
}

export const MatchScene = ({ onLeave }: MatchSceneProps) => {
  const room = useRoomStore((state) => state.room);
  const seat = useRoomStore((state) => state.seat);

  const matchState = useMatchStore((state) => state.state);
  const matchId = useMatchStore((state) => state.matchId);
  const selectedPieceId = useMatchStore((state) => state.selectedPieceId);
  const legalMoves = useMatchStore((state) => state.legalMoves);
  const selectPiece = useMatchStore((state) => state.selectPiece);
  const movePiece = useMatchStore((state) => state.submitMove);
  const loadingMatch = useMatchStore((state) => state.loading);
  const submitting = useMatchStore((state) => state.submitting);
  const matchError = useMatchStore((state) => state.error);
  const clearMatchError = useMatchStore((state) => state.clearError);
  const event = useMatchStore((state) => state.event);

  const boardDisabled = !matchState || loadingMatch || submitting;
  const history = matchState?.history.slice(-8).reverse() ?? [];
  const lastUpdate = event?.timestamp ? new Date(event.timestamp) : undefined;

  const announcement = useMemo(() => {
    if (!matchState) {
      return 'Inicie uma partida para gerar o tabuleiro.';
    }

    if (matchState.status === 'completed') {
      if (matchState.resolution?.reason === 'stalemate') {
        return 'Duelo empatado por afogamento.';
      }
      if (matchState.winnerId) {
        return `Vitória de ${resolveCodename(matchState.winnerId, room)}.`;
      }
      return 'Partida concluída.';
    }

    if (matchState.checkedPlayerId) {
      return `Xeque contra ${resolveCodename(matchState.checkedPlayerId, room)}.`;
    }

    return `Turno de ${resolveCodename(matchState.activePlayer, room)}.`;
  }, [matchState, room]);

  const playerCards = matchState?.players.map((playerId, index) => {
    const isActive = matchState.activePlayer === playerId;
    const isChecked = matchState.checkedPlayerId === playerId;
    const isWinner = matchState.winnerId === playerId;
    return {
      playerId,
      codename: resolveCodename(playerId, room),
      seatLabel: index === 0 ? 'Ordem Solar' : 'Círculo Umbral',
      isActive,
      isChecked,
      isWinner
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <ScenePanel
        title="Arena Ritual"
        subtitle={announcement}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            {matchId && <SceneTag>Match {matchId}</SceneTag>}
            {room?.code && <SceneTag> Sala {room.code}</SceneTag>}
            {seat && <SceneTag> Você: {seat === 'host' ? 'Anfitriã(o)' : 'Convidado(a)'} </SceneTag>}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Estado</p>
              <p className="text-lg font-semibold">{matchState ? statusLabels[matchState.status] : 'Aguardando ritual'}</p>
            </div>
            {lastUpdate && (
              <p className="text-xs text-white/50">
                Atualizado às{' '}
                {lastUpdate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
            <SceneButton variant="ghost" onClick={onLeave}>
              Encerrar Partida
            </SceneButton>
          </div>
          <MatchBoard
            state={matchState}
            selectedPieceId={selectedPieceId}
            legalMoves={legalMoves}
            disabled={boardDisabled}
            onSelectPiece={selectPiece}
            onSubmitMove={movePiece}
          />
          {matchError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <div className="flex items-center justify-between gap-3">
                <span>{matchError}</span>
                <button type="button" onClick={clearMatchError} className="text-xs uppercase tracking-[0.3em] text-rose-100">
                  limpar
                </button>
              </div>
            </div>
          )}
        </div>
      </ScenePanel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ScenePanel title="Briefing dos Jogadores" accent="aether">
          <SceneGrid>
            {playerCards?.map((player) => (
              <article key={player.playerId} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">{player.seatLabel}</p>
                    <p className="text-lg font-semibold">{player.codename}</p>
                  </div>
                  <SceneTag tone={player.isWinner ? 'positive' : player.isActive ? 'default' : 'warning'}>
                    {player.isWinner ? 'Vitória' : player.isActive ? 'Ativo' : 'Em espera'}
                  </SceneTag>
                </header>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                  {player.isChecked && <span className="rounded-full border border-rose-400/60 px-2 py-1 text-rose-100">Xeque</span>}
                </div>
              </article>
            )) || <p className="text-sm text-white/60">Aguardando jogadores.</p>}
          </SceneGrid>
        </ScenePanel>

        <ScenePanel title="Histórico Recente">
          <ul className="space-y-2 text-sm">
            {history.length === 0 && <li className="text-white/50">Nenhum movimento registrado.</li>}
            {history.map((record) => (
              <li
                key={`${record.turn}-${record.pieceId}-${record.to.x}-${record.to.y}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-2 font-mono text-xs"
              >
                <span className="text-white/60">T{record.turn.toString().padStart(2, '0')}</span>
                <span>{describeMove(record)}</span>
              </li>
            ))}
          </ul>
        </ScenePanel>
      </div>
    </div>
  );
};

