'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMatch } from '../lib/api';
import { useMatchChannel } from '../lib/realtime/useMatchChannel';
import { useMatchStore } from '../state/match-store';
import { useRoomStore, type RoomView } from '../state/room-store';
import {
  CreateRoomScene,
  JoinRoomScene,
  LobbyScene,
  MainMenuScene,
  MatchScene,
  SettingsOverlay,
  type GameSettingsState
} from '../scenes';
import { SceneButton, SceneTag } from '../scenes/components';

const SCENE_TITLES: Record<RoomView, string> = {
  menu: 'Menu Principal',
  create: 'Criar Sala',
  join: 'Entrar na Sala',
  lobby: 'Sala de Espera',
  match: 'Arena Ritual'
};

const SCENE_DESCRIPTIONS: Record<RoomView, string> = {
  menu: 'Selecione o modo e sincronize sprites antes de entrar em combate.',
  create: 'Defina seu codinome para gerar um código ritual.',
  join: 'Informe o código compartilhado para entrar diretamente no lobby.',
  lobby: 'Convide aliados e aguarde o sinal para iniciar.',
  match: 'Controle o tabuleiro em tempo real via PixiJS.'
};

export default function Home() {
  const [settings, setSettings] = useState<GameSettingsState>({ audio: true, hints: true, telemetry: false });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const roomView = useRoomStore((state) => state.view);
  const room = useRoomStore((state) => state.room);
  const seat = useRoomStore((state) => state.seat);
  const roomError = useRoomStore((state) => state.error);
  const refreshRoom = useRoomStore((state) => state.refreshRoom);
  const clearRoomError = useRoomStore((state) => state.clearError);
  const resetRoom = useRoomStore((state) => state.reset);
  const setRoomView = useRoomStore((state) => state.setView);

  const matchState = useMatchStore((state) => state.state);
  const matchError = useMatchStore((state) => state.error);
  const matchId = useMatchStore((state) => state.matchId);
  const ingestMatch = useMatchStore((state) => state.ingestMatch);
  const clearMatchError = useMatchStore((state) => state.clearError);
  const setMatchErrorMessage = useMatchStore((state) => state.setError);
  const setLocalPlayer = useMatchStore((state) => state.setLocalPlayer);
  const resetMatch = useMatchStore((state) => state.reset);

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

  const handleReturnToMenu = () => {
    resetRoom();
    resetMatch();
    setRoomView('menu');
    clearRoomError();
    clearMatchError();
  };

  const toggleSetting = (key: keyof GameSettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const alerts = useMemo(
    () =>
      [
        roomError && { id: 'room', message: roomError, onDismiss: clearRoomError },
        matchError && { id: 'match', message: matchError, onDismiss: clearMatchError }
      ].filter(Boolean) as Array<{ id: string; message: string; onDismiss: () => void }>,
    [roomError, matchError, clearRoomError, clearMatchError]
  );

  const renderScene = () => {
    switch (roomView) {
      case 'create':
        return <CreateRoomScene onBack={() => setRoomView('menu')} />;
      case 'join':
        return <JoinRoomScene onBack={() => setRoomView('menu')} />;
      case 'lobby':
        return <LobbyScene onLeave={handleReturnToMenu} />;
      case 'match':
        return <MatchScene onLeave={handleReturnToMenu} />;
      default:
        return <MainMenuScene onOpenSettings={() => setSettingsOpen(true)} />;
    }
  };

  const sceneTitle = SCENE_TITLES[roomView];
  const sceneDescription =
    roomView === 'match' && matchState
      ? `Status: ${matchState.status}`
      : SCENE_DESCRIPTIONS[roomView];
  const hasSession = Boolean(room || matchId);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-[#06030d] to-[#010005] text-white">
      <div className="aurora" aria-hidden="true" />
      <div className="grid-lines" aria-hidden="true" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <SceneHeader
          title={sceneTitle}
          description={sceneDescription}
          roomCode={room?.code}
          matchId={matchId}
          seat={seat}
          onOpenSettings={() => setSettingsOpen(true)}
          onReturn={handleReturnToMenu}
          canReset={hasSession || roomView !== 'menu'}
        />
        <section className="flex-1">{renderScene()}</section>
        <SceneAlerts alerts={alerts} />
      </main>
      <SettingsOverlay open={settingsOpen} settings={settings} onToggle={toggleSetting} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

interface SceneHeaderProps {
  title: string;
  description: string;
  roomCode?: string;
  matchId?: string;
  seat?: ReturnType<typeof useRoomStore.getState>['seat'];
  onOpenSettings: () => void;
  onReturn: () => void;
  canReset: boolean;
}

const SceneHeader = ({ title, description, roomCode, matchId, seat, onOpenSettings, onReturn, canReset }: SceneHeaderProps) => (
  <header className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-ember-strong)]">{title}</p>
        <h1 className="text-3xl font-semibold">{description}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {roomCode && <SceneTag>Sala {roomCode}</SceneTag>}
        {matchId && <SceneTag>Match {matchId}</SceneTag>}
        {seat && <SceneTag>Você: {seat === 'host' ? 'Anfitrião' : 'Convidado'}</SceneTag>}
        <SceneButton variant="ghost" onClick={onOpenSettings}>
          Configurações
        </SceneButton>
        <SceneButton variant="outline" onClick={onReturn} disabled={!canReset}>
          Menu
        </SceneButton>
      </div>
    </div>
  </header>
);

const SceneAlerts = ({ alerts }: { alerts: Array<{ id: string; message: string; onDismiss: () => void }> }) => {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          <span>{alert.message}</span>
          <button type="button" onClick={alert.onDismiss} className="text-xs uppercase tracking-[0.3em] text-rose-100">
            limpar
          </button>
        </div>
      ))}
    </div>
  );
};

