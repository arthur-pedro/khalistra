'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { type GameStatus, type MoveRecord } from '@khalistra/game-engine';
import { CORE_GAME_EVENTS } from '@khalistra/shared/constants';
import type { RoomSeat, RoomSnapshot } from '@khalistra/shared/types';
import { MatchBoard } from '../components/board';
import { useMatchStore } from '../state/match-store';
import { useRoomStore, type RoomView } from '../state/room-store';
import { useMatchChannel } from '../lib/realtime/useMatchChannel';
import { fetchMatch } from '../lib/api';

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
  awaiting: 'Aguardando conexão',
  'in-progress': 'Duelo em andamento',
  check: 'Xeque declarado',
  ritual: 'Ritual extraordinário',
  completed: 'Conclusão do ritual'
};

const roomStatusLabels = {
  waiting: 'Aguardando convidado',
  ready: 'Pronto para iniciar',
  'in-match': 'Duelo em andamento',
  closed: 'Duelo encerrado',
  expired: 'Sala expirada'
};

const formatSquare = (position: { x: number; y: number }) => `${String.fromCharCode(97 + position.x)}${position.y + 1}`;

const describeMove = (record: MoveRecord) => {
  const [, pieceType = record.pieceId] = record.pieceId.split('.');
  const captureMarker = record.capturedPieceType ? 'x' : '→';
  const promotion = record.promotion ? ` (promoção: ${record.promotion})` : '';
  const suffix = record.checkmate ? ' #RitualFinal' : record.check ? ' +Xeque' : '';
  return `${pieceType.toUpperCase()} ${captureMarker} ${formatSquare(record.to)}${promotion}${suffix}`;
};

const resolveCodename = (playerId: string, room?: RoomSnapshot) => {
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

const formatCountdown = (expiresAt?: string) => {
  if (!expiresAt) {
    return '';
  }
  const distance = new Date(expiresAt).getTime() - Date.now();
  if (distance <= 0) {
    return 'Tempo esgotado';
  }
  const minutes = Math.floor(distance / 60000);
  const seconds = Math.floor((distance % 60000) / 1000)
    .toString()
    .padStart(2, '0');
  return `${minutes}m ${seconds}s`;
};

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ audio: true, hints: true, telemetry: false });

  const roomView = useRoomStore((state) => state.view);
  const room = useRoomStore((state) => state.room);
  const seat = useRoomStore((state) => state.seat);
  const roomLoading = useRoomStore((state) => state.loading);
  const roomError = useRoomStore((state) => state.error);
  const createRoom = useRoomStore((state) => state.createRoom);
  const joinRoom = useRoomStore((state) => state.joinRoom);
  const refreshRoom = useRoomStore((state) => state.refreshRoom);
  const clearRoomError = useRoomStore((state) => state.clearError);
  const startRoomMatch = useRoomStore((state) => state.startMatch);
  const setRoomView = useRoomStore((state) => state.setView);
  const resetRoom = useRoomStore((state) => state.reset);

  const matchState = useMatchStore((store) => store.state);
  const matchId = useMatchStore((store) => store.matchId);
  const loadingMatch = useMatchStore((store) => store.loading);
  const submitting = useMatchStore((store) => store.submitting);
  const matchError = useMatchStore((store) => store.error);
  const legalMoves = useMatchStore((store) => store.legalMoves);
  const selectedPieceId = useMatchStore((store) => store.selectedPieceId);
  const selectPiece = useMatchStore((store) => store.selectPiece);
  const movePiece = useMatchStore((store) => store.submitMove);
  const ingestMatch = useMatchStore((store) => store.ingestMatch);
  const clearMatchError = useMatchStore((store) => store.clearError);
  const setMatchErrorMessage = useMatchStore((store) => store.setError);
  const setLocalPlayer = useMatchStore((store) => store.setLocalPlayer);
  const resetMatch = useMatchStore((store) => store.reset);
  const event = useMatchStore((store) => store.event);

  const localPlayerId = seat === 'host' ? room?.host.playerId : seat === 'guest' ? room?.guest?.playerId : undefined;

  useEffect(() => {
    setLocalPlayer(localPlayerId);
  }, [localPlayerId, setLocalPlayer]);

  useEffect(() => {
    if (roomView !== 'lobby') {
      return;
    }
    const interval = setInterval(() => {
      void refreshRoom();
    }, 4000);
    void refreshRoom();
    return () => clearInterval(interval);
  }, [roomView, refreshRoom]);

  useEffect(() => {
    if (!room?.matchId || room?.matchId === matchId) {
      return;
    }
    void fetchMatch(room.matchId)
      .then((payload) => ingestMatch(payload))
      .catch((error) => setMatchErrorMessage(error instanceof Error ? error.message : 'Falha ao sincronizar partida.'));
  }, [room?.matchId, matchId, ingestMatch, setMatchErrorMessage]);

  useMatchChannel({
    matchId,
    enabled: Boolean(matchId),
    playerId: localPlayerId,
    onSnapshot: ingestMatch,
    onError: (error) => setMatchErrorMessage(error.message)
  });

  const [, forceCountdownTick] = useState(0);
  useEffect(() => {
    if (!room?.expiresAt) {
      return;
    }
    const interval = setInterval(() => {
      forceCountdownTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.expiresAt, forceCountdownTick]);

  const countdown = room?.expiresAt ? formatCountdown(room.expiresAt) : '';

  const boardDisabled = !matchState || roomView !== 'match' || submitting || loadingMatch;

  const history = matchState?.history.slice(-10).reverse() ?? [];
  const lastUpdate = event?.timestamp ? new Date(event.timestamp) : undefined;

  const announcement = useMemo(() => {
    if (roomView !== 'match' || !matchState) {
      return 'Selecione uma sala para iniciar o ritual.';
    }

    if (matchState.status === 'completed') {
      if (matchState.resolution?.reason === 'stalemate') {
        return 'Partida encerrada em empate.';
      }
      if (matchState.winnerId) {
        return `Vitória de ${resolveCodename(matchState.winnerId, room)} por ${matchState.resolution?.reason ?? 'finalização'}.`;
      }
      return 'Partida concluída.';
    }

    if (matchState.checkedPlayerId) {
      return `Xeque contra ${resolveCodename(matchState.checkedPlayerId, room)}.`;
    }

    return `Turno de ${resolveCodename(matchState.activePlayer, room)}.`;
  }, [matchState, room, roomView]);

  const handleStartMatch = async () => {
    const payload = await startRoomMatch();
    if (payload) {
      ingestMatch(payload);
    }
  };

  const handleExit = () => {
    resetRoom();
    resetMatch();
    setRoomView('menu');
    clearRoomError();
    clearMatchError();
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const roomStatusText = room ? roomStatusLabels[room.status] : 'Nenhuma sala ativa';
  const playerCards = matchState?.players.map((playerId, index) => {
    const isActive = matchState.activePlayer === playerId;
    const isChecked = matchState.checkedPlayerId === playerId;
    const isWinner = matchState.winnerId === playerId;
    return {
      playerId,
      seatLabel: PLAYER_TITLES[index],
      codename: resolveCodename(playerId, room),
      isActive,
      isChecked,
      isWinner
    };
  });

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-[#0a0613] to-[#030208] text-white">
      <div className="aurora" aria-hidden="true" />
      <div className="grid-lines" aria-hidden="true" />
      <main className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
          <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl shadow-black/60">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Menu Principal</p>
              <h2 className="text-2xl font-semibold">Khalistra Launcher</h2>
              <p className="text-sm text-white/70">Configure seu ritual, convide aliados e mantenha o cliente sempre sincronizado.</p>
            </div>
            <nav className="mt-6 flex flex-col gap-3 text-left text-sm">
              <DesktopMenuButton label="Criar Partida" active={roomView === 'create'} onClick={() => setRoomView('create')} />
              <DesktopMenuButton label="Entrar em Partida" active={roomView === 'join'} onClick={() => setRoomView('join')} />
              <DesktopMenuButton label="Configurações" active={showSettings} onClick={() => setShowSettings((state) => !state)} />
              <DesktopMenuButton label="Sair" onClick={handleExit} danger />
            </nav>
            {showSettings && (
              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
                <h3 className="text-xs uppercase tracking-[0.3em] text-white/60">Ajustes rápidos</h3>
                <DesktopToggle label="Áudio Ambiente" checked={settings.audio} onChange={() => toggleSetting('audio')} />
                <DesktopToggle label="Assistente de jogadas" checked={settings.hints} onChange={() => toggleSetting('hints')} />
                <DesktopToggle label="Enviar telemetria" checked={settings.telemetry} onChange={() => toggleSetting('telemetry')} />
              </div>
            )}
            <footer className="mt-auto pt-6 text-xs text-white/50">
              <p>Build ritual α</p>
              <p className="text-white/30">Interface otimizada para desktop — Steam ready.</p>
            </footer>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl shadow-black/70">
            {roomView === 'match' && matchState ? (
              <div className="flex flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-ember-strong)]">Arena ritual</p>
                    <h1 className="text-3xl font-semibold">Duelo clássico em andamento</h1>
                    <p className="text-sm text-white/60">{announcement}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 px-4 py-3 text-right text-xs">
                    <p className="text-white/60">Match ID</p>
                    <p className="font-mono text-white">{matchId}</p>
                    {room?.code && <p className="text-white/40">Sala {room.code}</p>}
                  </div>
                </header>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    {matchError && (
                      <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                        <span>{matchError}</span>
                        <button type="button" onClick={clearMatchError} className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 hover:text-white">
                          Fechar
                        </button>
                      </div>
                    )}
                    <MatchBoard
                      state={matchState}
                      selectedPieceId={selectedPieceId}
                      legalMoves={legalMoves}
                      disabled={boardDisabled}
                      onSelectPiece={selectPiece}
                      onSubmitMove={movePiece}
                    />
                    <div className="flex flex-wrap gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => selectPiece(undefined)}
                        className="rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40"
                      >
                        Limpar seleção
                      </button>
                      <button
                        type="button"
                        onClick={handleExit}
                        className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-white"
                      >
                        Encerrar ritual
                      </button>
                      {(loadingMatch || submitting) && (
                        <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                          {loadingMatch ? 'Sincronizando...' : 'Processando jogada...'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Estado atual</p>
                      <h3 className="text-xl font-semibold">{statusLabels[matchState.status]}</h3>
                      {matchState?.resolution?.reason === 'stalemate' && <p className="text-xs text-white/60">Empate por afogamento.</p>}
                      {lastUpdate && (
                        <p className="text-xs text-white/50">Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {playerCards?.map((player) => (
                        <article key={player.playerId} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <header className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{player.seatLabel}</p>
                              <p className="font-semibold">{player.codename}</p>
                            </div>
                            <span
                              className={[
                                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                                player.isWinner
                                  ? 'bg-emerald-500/20 text-emerald-200'
                                  : player.isActive
                                    ? 'bg-[var(--color-ember)]/20 text-[var(--color-ember-strong)]'
                                    : 'bg-white/5 text-white/60'
                              ].join(' ')}
                            >
                              {player.isWinner ? 'Vitória' : player.isActive ? 'Ativo' : 'Aguardando'}
                            </span>
                          </header>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                            {player.isChecked && <span className="rounded-full border border-rose-400/40 px-2 py-0.5 text-rose-200">Xeque</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Últimos movimentos</p>
                      <ul className="mt-3 space-y-2 text-xs text-white/80">
                        {history.length === 0 && <li>Nenhum movimento registrado ainda.</li>}
                        {history.map((record) => (
                          <li
                            key={`${record.turn}-${record.pieceId}-${record.to.x}-${record.to.y}`}
                            className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 font-mono"
                          >
                            <span className="text-white/60">T{record.turn.toString().padStart(2, '0')} · </span>
                            <span>{describeMove(record)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <DesktopHero roomView={roomView} />
            )}
          </section>

          <aside className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl shadow-black/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Sistema de Salas</p>
              <h2 className="text-xl font-semibold">{roomStatusText}</h2>
              {room && <p className="text-xs text-white/50">Expira em {countdown || '—'}</p>}
            </div>
            {roomError && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-100">
                <span>{roomError}</span>
                <button type="button" onClick={clearRoomError} className="text-[0.6rem] uppercase tracking-[0.3em] text-rose-200 hover:text-white">
                  Fechar
                </button>
              </div>
            )}
            <div className="mt-6">
              {roomView === 'create' && (
                <CreateRoomForm loading={roomLoading} onSubmit={createRoom} onCancel={() => setRoomView('menu')} />
              )}
              {roomView === 'join' && (
                <JoinRoomForm loading={roomLoading} onSubmit={joinRoom} onCancel={() => setRoomView('menu')} />
              )}
              {roomView === 'lobby' && room && (
                <LobbyPanel
                  room={room}
                  seat={seat}
                  loading={roomLoading}
                  countdown={countdown}
                  onStart={handleStartMatch}
                  onBack={() => setRoomView('menu')}
                />
              )}
              {roomView === 'match' && room && (
                <MatchMetaPanel room={room} seat={seat} countdown={countdown} onExit={handleExit} />
              )}
              {roomView === 'menu' && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 p-4 text-sm text-white/70">
                  <p>Escolha criar ou entrar em uma sala privada. Os códigos possuem 6 caracteres e expiram automaticamente.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        <section id="roadmap" className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-inner shadow-black/70">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-ember-strong)]">Próximos rituais</p>
              <h3 className="text-2xl font-semibold">Roadmap de implementação</h3>
            </div>
            <Link
              href="#roadmap"
              className="rounded-full border border-white/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white"
            >
              Abrir manifesto
            </Link>
          </header>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <article key={milestone.label} className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{milestone.label}</p>
                <p className="mt-2 text-sm text-white/80">{milestone.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-lg font-semibold text-[var(--color-ember-strong)]">{pillar.title}</h4>
                <p className="mt-2 text-sm text-white/70">{pillar.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const DesktopMenuButton = ({
  label,
  active,
  danger,
  onClick
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'rounded-2xl border px-4 py-3 text-left font-semibold transition',
      danger
        ? 'border-rose-500/40 text-rose-200 hover:border-rose-400 hover:text-white'
        : active
          ? 'border-white/60 bg-white/10 text-white'
          : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
    ].join(' ')}
  >
    {label}
  </button>
);

const DesktopToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3">
    <span>{label}</span>
    <span
      className={[
        'inline-flex h-6 w-11 items-center rounded-full border px-1 transition',
        checked ? 'border-[var(--color-ember-strong)] bg-[var(--color-ember)] text-black' : 'border-white/20 bg-transparent text-white/70'
      ].join(' ')}
      onClick={onChange}
    >
      <span
        className={[
          'h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        ].join(' ')}
      />
    </span>
  </label>
);

const DesktopHero = ({ roomView }: { roomView: RoomView }) => (
  <div className="flex flex-col gap-6">
    <header className="space-y-4">
      <p className="text-xs uppercase tracking-[0.4em] text-[rgba(210,165,72,0.85)]">Ordem Khalistra</p>
      <h1 className="text-4xl font-semibold leading-tight">Estratégias vivas moldadas por rituais, caos controlado e escolhas permanentes.</h1>
      <p className="text-base text-white/70">
        Cada jogada pode invocar cartas, distorcer linhas sagradas e reescrever a partida. Nosso objetivo é prototipar uma experiência elegante, competitiva e mística — inspirada em Chaturanga, Balatro e autochess modernos.
      </p>
      <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/70">
        {ritualEvents.map((event) => (
          <li key={event} className="rounded-full border border-white/15 px-3 py-1 text-white/80">
            {event}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="#roadmap"
          className="rounded-full bg-[var(--color-ember)] px-6 py-3 font-semibold uppercase tracking-wide text-black transition hover:bg-[var(--color-ember-strong)]"
        >
          Consultar roadmap
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="rounded-full border border-white/20 px-6 py-3 font-semibold uppercase tracking-wide text-white transition hover:border-white"
        >
          {roomView === 'menu' ? 'Explorar manifesto' : 'Voltar ao topo'}
        </button>
      </div>
    </header>
  </div>
);

const CreateRoomForm = ({
  loading,
  onSubmit,
  onCancel
}: {
  loading: boolean;
  onSubmit: (codename: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const [codename, setCodename] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!codename.trim()) {
      return;
    }
    void onSubmit(codename.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-white/70">Defina seu codinome e gere um código privado para convidar outro ritualista.</p>
      </div>
      <label className="text-xs uppercase tracking-[0.3em] text-white/50">
        Codinome
        <input
          type="text"
          value={codename}
          onChange={(event) => setCodename(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white"
          placeholder="Ex: Auriga Prime"
        />
      </label>
      <div className="flex gap-3 text-sm">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-[var(--color-ember)] px-4 py-3 font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[var(--color-ember-strong)] disabled:opacity-60"
        >
          {loading ? 'Gerando...' : 'Criar sala'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-white/20 px-4 py-3 text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Voltar
        </button>
      </div>
    </form>
  );
};

const JoinRoomForm = ({
  loading,
  onSubmit,
  onCancel
}: {
  loading: boolean;
  onSubmit: (code: string, codename: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const [code, setCode] = useState('');
  const [codename, setCodename] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !codename.trim()) {
      return;
    }
    void onSubmit(code.trim().toUpperCase(), codename.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-white/70">Insira o código de 6 caracteres recebido e sua identidade.</p>
      <label className="text-xs uppercase tracking-[0.3em] text-white/50">
        Código da sala
        <input
          type="text"
          value={code}
          maxLength={8}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white"
          placeholder="Ex: ABX93P"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.3em] text-white/50">
        Codinome
        <input
          type="text"
          value={codename}
          onChange={(event) => setCodename(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white"
          placeholder="Ex: Umbral"
        />
      </label>
      <div className="flex gap-3 text-sm">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-[var(--color-ember)] px-4 py-3 font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[var(--color-ember-strong)] disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-white/20 px-4 py-3 text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Voltar
        </button>
      </div>
    </form>
  );
};

const LobbyPanel = ({
  room,
  seat,
  loading,
  countdown,
  onStart,
  onBack
}: {
  room: RoomSnapshot;
  seat?: RoomSeat;
  loading: boolean;
  countdown: string;
  onStart: () => void;
  onBack: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const canStart = seat === 'host' && room.status === 'ready';

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-2xl border border-white/15 bg-black/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Código da sala</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-lg tracking-[0.4em]">{room.code}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 hover:border-white/40 hover:text-white"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-2 text-xs text-white/50">Expira em {countdown || '—'}</p>
      </div>
      <div className="space-y-3">
        {[room.host, room.guest].map((player, index) => (
          <article key={player?.playerId ?? index} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{PLAYER_TITLES[index]}</p>
            <p className="text-lg font-semibold">{player ? player.codename : 'Slot disponível'}</p>
            <p className="text-xs text-white/60">{player ? 'Conectado' : 'Aguardando...'}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {seat === 'host' ? (
          <button
            type="button"
            disabled={!canStart || loading}
            onClick={onStart}
            className="flex-1 rounded-2xl bg-[var(--color-ember)] px-4 py-3 font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[var(--color-ember-strong)] disabled:opacity-60"
          >
            {loading ? 'Verificando...' : canStart ? 'Iniciar duelo' : 'Aguardando convidado'}
          </button>
        ) : (
          <div className="flex-1 rounded-2xl border border-white/15 px-4 py-3 text-center text-white/70">Aguardando o anfitrião iniciar</div>
        )}
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-white/20 px-4 py-3 text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

const MatchMetaPanel = ({
  room,
  seat,
  countdown,
  onExit
}: {
  room: RoomSnapshot;
  seat?: RoomSeat;
  countdown: string;
  onExit: () => void;
}) => (
  <div className="space-y-4 text-sm">
    <div className="rounded-2xl border border-white/15 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Sala ativa</p>
      <p className="font-mono text-lg tracking-[0.4em]">{room.code}</p>
      <p className="text-xs text-white/50">Expira em {countdown || '—'}</p>
    </div>
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Você está como</p>
      <p className="text-lg font-semibold">{seat === 'host' ? 'Anfitrião (Peças claras)' : seat === 'guest' ? 'Convidado (Peças sombrias)' : 'Espectador'}</p>
    </div>
    <button
      type="button"
      onClick={onExit}
      className="w-full rounded-2xl border border-white/20 px-4 py-3 text-white/80 transition hover:border-white/40 hover:text-white"
    >
      Finalizar sessão
    </button>
  </div>
);
