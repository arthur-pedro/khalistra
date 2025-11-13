'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { type GameStatus, type MoveRecord, type Vector2 } from '@khalistra/game-engine';
import { CORE_GAME_EVENTS } from '@khalistra/shared/constants';
import { MatchBoard } from '../components/board';
import { useMatchStore } from '../state/match-store';
import { useMatchChannel } from '../lib/realtime/useMatchChannel';

const pillars = [
  {
    title: 'Regras Vivas',
    detail: 'Cartas de ritual alteram alcance, ordem de turnos e até a geometria do tabuleiro.'
  },
  {
    title: 'Progressão Tática',
    detail: 'Cada duelo concede essências para desbloquear escolas e experimentos na forja arcana.'
  },
  {
    title: 'PvP Event-Driven',
    detail: 'Socket.io garante sincronização instantânea e feedback estruturado para cada ação crítica.'
  }
];

const milestones = [
  {
    label: 'Protótipo Web',
    description: 'Frontend Next.js + Zustand para simular duelos rápidos e validar novas peças.'
  },
  {
    label: 'Engine Independente',
    description: 'Módulo game-engine com regras isoladas e testes Jest cobrindo 80% do core.'
  },
  {
    label: 'Arena Ritual',
    description: 'Matchmaking em tempo real, monitorado via OpenTelemetry + Prometheus.'
  }
];

const ritualEvents = CORE_GAME_EVENTS.slice(0, 3);
const PLAYER_TITLES = ['Ordem Solar', 'Círculo Umbral'] as const;

const statusLabels: Record<GameStatus, string> = {
  'awaiting': 'Aguardando conexão',
  'in-progress': 'Duelo em andamento',
  check: 'Xeque declarado',
  ritual: 'Ritual extraordinário',
  completed: 'Conclusão do ritual'
};

const formatSquare = (position: Vector2) => `${String.fromCharCode(97 + position.x)}${position.y + 1}`;

const describeMove = (record: MoveRecord) => {
  const [, pieceType = record.pieceId] = record.pieceId.split('.');
  const captureMarker = record.capturedPieceType ? 'x' : '→';
  const promotion = record.promotion ? ` (promoção: ${record.promotion})` : '';
  const suffix = record.checkmate ? ' #RitualFinal' : record.check ? ' +Xeque' : '';
  return `${pieceType.toUpperCase()} ${captureMarker} ${formatSquare(record.to)}${promotion}${suffix}`;
};

export default function Home() {
  const state = useMatchStore((store) => store.state);
  const matchId = useMatchStore((store) => store.matchId);
  const loading = useMatchStore((store) => store.loading);
  const submitting = useMatchStore((store) => store.submitting);
  const error = useMatchStore((store) => store.error);
  const legalMoves = useMatchStore((store) => store.legalMoves);
  const selectedPieceId = useMatchStore((store) => store.selectedPieceId);
  const spawnMatch = useMatchStore((store) => store.spawnMatch);
  const selectPiece = useMatchStore((store) => store.selectPiece);
  const movePiece = useMatchStore((store) => store.submitMove);
  const ingestMatch = useMatchStore((store) => store.ingestMatch);
  const setError = useMatchStore((store) => store.setError);
  const clearError = useMatchStore((store) => store.clearError);
  const event = useMatchStore((store) => store.event);

  useEffect(() => {
    void spawnMatch();
  }, [spawnMatch]);

  useMatchChannel({
    matchId,
    enabled: Boolean(matchId && state?.status !== 'completed'),
    onSnapshot: ingestMatch,
    onError: (err) => setError(err?.message || 'Falha ao sincronizar estado da partida.')
  });

  const boardDisabled = loading || submitting || !state || state.status === 'completed';

  const history = state?.history.slice(-10).reverse() ?? [];
  const lastUpdate = event?.timestamp ? new Date(event.timestamp) : undefined;

  const announcement = useMemo(() => {
    if (!state) {
      return 'Tabuleiro ritual em preparação.';
    }

    if (state.status === 'completed') {
      if (state.resolution?.reason === 'stalemate') {
        return 'Partida encerrada em empate.';
      }
      if (state.winnerId) {
        return `Vitória de ${state.winnerId} por ${state.resolution?.reason ?? 'finalização'}.`;
      }
      return 'Partida concluída.';
    }

    if (state.checkedPlayerId) {
      return `Xeque contra ${state.checkedPlayerId}.`;
    }

    return `Turno de ${state.activePlayer}.`;
  }, [state]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-0 lg:py-16">
      <div className="aurora" aria-hidden="true" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-[rgba(13,6,22,0.85)] to-[rgba(5,3,8,0.92)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur">
        <section id="manuscritos" className="flex flex-col gap-8 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-[rgba(210,165,72,0.85)]">Ordem Khalistra</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Estratégias vivas moldadas por rituais, caos controlado e escolhas permanentes.
            </h1>
            <p className="text-lg text-zinc-200">
              Cada jogada pode invocar cartas, distorcer linhas sagradas e reescrever a partida. Nosso objetivo é
              prototipar uma experiência elegante, competitiva e mística — inspirada em Chaturanga, Balatro e
              autochess modernos.
            </p>
            <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/70">
              {ritualEvents.map((event) => (
                <li key={event} className="rounded-full border border-white/15 px-3 py-1 text-white/80">
                  {event}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#laboratorio"
                className="rounded-full bg-[var(--color-ember)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-[var(--color-ember-strong)]"
              >
                Entrar no laboratório tático
              </Link>
              <Link
                href="#cronograma"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/5"
              >
                Consultar roadmap
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200 shadow-inner lg:w-auto">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Stack oficial</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Frontend</dt>
                <dd className="font-semibold text-white">Next.js + Tailwind + Zustand</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Backend</dt>
                <dd className="font-semibold text-white">NestJS + Socket.io</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Dados</dt>
                <dd className="font-semibold text-white">PostgreSQL + Redis</dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="laboratorio" className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <header className="flex items-center justify-between text-sm text-white/70">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-ember-strong)]">Primeiro protótipo jogável</p>
                <h2 className="text-2xl font-semibold text-white">Tabuleiro clássico com regras modernas</h2>
              </div>
              <div className="text-right text-xs">
                <p className="text-white/60">Match ID</p>
                <p className="font-mono text-white">{matchId ?? '–'}</p>
              </div>
            </header>
            {error && (
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            )}
            <MatchBoard
              state={state}
              selectedPieceId={selectedPieceId}
              legalMoves={legalMoves}
              disabled={boardDisabled}
              onSelectPiece={selectPiece}
              onSubmitMove={movePiece}
            />
            <span aria-live="polite" className="sr-only">
              {announcement}
            </span>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  void spawnMatch();
                }}
                disabled={loading}
                className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white disabled:opacity-50"
              >
                Reiniciar ritual
              </button>
              <button
                type="button"
                onClick={() => selectPiece(undefined)}
                className="rounded-full border border-white/10 px-4 py-2 text-white/80 transition hover:border-white/40"
              >
                Limpar seleção
              </button>
              {loading && <span className="text-xs uppercase tracking-[0.3em] text-white/60">Invocando tabuleiro…</span>}
              {submitting && <span className="text-xs uppercase tracking-[0.3em] text-white/60">Processando jogada…</span>}
            </div>
          </div>
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-inner shadow-black/40">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Estado</p>
              <h3 className="text-xl font-semibold">{state ? statusLabels[state.status] : 'Carregando ritual'}</h3>
              {state?.resolution?.reason === 'stalemate' && (
                <p className="text-sm text-white/70">Empate por afogamento — nenhum movimento legal restante.</p>
              )}
              {state?.checkedPlayerId && state.status !== 'completed' && (
                <p className="text-sm text-rose-200">
                  Xeque contra {state.checkedPlayerId === state.players[0] ? PLAYER_TITLES[0] : PLAYER_TITLES[1]}.
                </p>
              )}
              {lastUpdate && (
                <p className="text-xs text-white/60">
                  Atualizado em {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              {state?.players.map((playerId, index) => {
                const isActive = state.activePlayer === playerId;
                const isChecked = state.checkedPlayerId === playerId;
                const isWinner = state.winnerId === playerId;
                return (
                  <article
                    key={playerId}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner shadow-black/40"
                  >
                    <header className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{PLAYER_TITLES[index]}</p>
                        <p className="font-semibold text-white">{playerId}</p>
                      </div>
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : isActive
                              ? 'bg-[var(--color-ember)]/20 text-[var(--color-ember-strong)]'
                              : 'bg-white/5 text-white/60'
                        ].join(' ')}
                      >
                        {isWinner ? 'Vitória' : isActive ? 'Ativo' : 'Aguardando'}
                      </span>
                    </header>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                      {isChecked && <span className="rounded-full border border-rose-400/40 px-2 py-0.5 text-rose-200">Xeque</span>}
                      {state?.resolution?.reason === 'stalemate' && !state.winnerId && (
                        <span className="rounded-full border border-white/20 px-2 py-0.5 text-white/70">Empate</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Últimos movimentos</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {history.length === 0 && <li>Nenhum movimento registrado ainda.</li>}
                {history.map((record) => (
                  <li
                    key={`${record.turn}-${record.pieceId}-${record.to.x}-${record.to.y}`}
                    className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs"
                  >
                    <span className="text-white/60">T{record.turn.toString().padStart(2, '0')} · </span>
                    <span>{describeMove(record)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/40"
            >
              <h2 className="text-lg font-semibold text-[var(--color-ember-strong)]">{pillar.title}</h2>
              <p className="mt-3 text-sm text-zinc-200">{pillar.detail}</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/60">Sempre testável</p>
            </article>
          ))}
        </section>

        <section id="cronograma" className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/50">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-ember-strong)]">Próximos rituais</p>
              <h3 className="text-2xl font-semibold text-white">Roadmap de implementação</h3>
            </div>
            <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
              Módulos isolados
            </span>
          </header>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <article
                key={milestone.label}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">{milestone.label}</p>
                <p className="mt-2 text-sm text-zinc-200">{milestone.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
