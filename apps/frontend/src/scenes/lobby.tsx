'use client';

import { SceneButton, SceneGrid, ScenePanel, SceneTag } from './components';
import { useCountdown } from './hooks/useCountdown';
import { useMatchStore } from '../state/match-store';
import { useRoomStore } from '../state/room-store';

const roomStatusLabels = {
  waiting: 'Aguardando convidado',
  ready: 'Pronto para iniciar',
  'in-match': 'Duelo em andamento',
  closed: 'Ritual encerrado',
  expired: 'Sala expirada'
};

interface LobbySceneProps {
  onLeave: () => void;
}

export const LobbyScene = ({ onLeave }: LobbySceneProps) => {
  const room = useRoomStore((state) => state.room);
  const seat = useRoomStore((state) => state.seat);
  const startRoomMatch = useRoomStore((state) => state.startMatch);
  const loading = useRoomStore((state) => state.loading);

  const ingestMatch = useMatchStore((state) => state.ingestMatch);

  const countdown = useCountdown(room?.expiresAt);

  if (!room) {
    return (
      <ScenePanel title="Sala de Espera" subtitle="Nenhuma sala conectada." accent="aether">
        <p className="text-sm text-white/70">Volte ao menu e crie ou entre em uma sala para iniciar a preparação.</p>
      </ScenePanel>
    );
  }

  const canStart = seat === 'host' && room.status === 'ready' && !loading;

  const handleStart = async () => {
    const payload = await startRoomMatch();
    if (payload) {
      ingestMatch(payload);
    }
  };

  return (
    <ScenePanel title="Sala de Espera" subtitle="Convide seu oponente e sincronize os rituais.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Código da Sala</p>
            <p className="text-3xl font-semibold tracking-[0.3em]">{room.code}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <SceneTag tone={countdown.expired ? 'warning' : 'default'}>{countdown.label}</SceneTag>
            <p className="text-xs text-white/60">{roomStatusLabels[room.status]}</p>
          </div>
        </div>

        <SceneGrid>
          {[room.host, room.guest].map((slot, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{index === 0 ? 'Anfitrião' : 'Convidado'}</p>
                  <p className="text-lg font-semibold">{slot?.codename ?? 'Slot vazio'}</p>
                </div>
                <SceneTag tone={slot ? 'positive' : 'warning'}>{slot ? 'Conectado' : 'Esperando'}</SceneTag>
              </header>
              {slot ? (
                <p className="mt-2 text-xs text-white/60">Jogador {slot.playerId}</p>
              ) : (
                <p className="mt-2 text-xs text-white/60">Compartilhe o código para preencher este espaço.</p>
              )}
            </article>
          ))}
        </SceneGrid>

        <div className="flex flex-wrap gap-4">
          {seat === 'host' && (
            <SceneButton onClick={handleStart} disabled={!canStart}>
              Iniciar Duelo
            </SceneButton>
          )}
          <SceneButton type="button" variant="ghost" onClick={onLeave}>
            Abandonar Sala
          </SceneButton>
        </div>
      </div>
    </ScenePanel>
  );
};

