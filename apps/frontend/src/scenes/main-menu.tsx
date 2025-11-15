'use client';

import { SceneButton, SceneGrid, ScenePanel, SceneTag } from './components';
import { useMatchStore } from '../state/match-store';
import { useRoomStore } from '../state/room-store';

interface MainMenuSceneProps {
  onOpenSettings: () => void;
}

export const MainMenuScene = ({ onOpenSettings }: MainMenuSceneProps) => {
  const setView = useRoomStore((state) => state.setView);
  const room = useRoomStore((state) => state.room);
  const seat = useRoomStore((state) => state.seat);
  const loadingRoom = useRoomStore((state) => state.loading);

  const spawnMatch = useMatchStore((state) => state.spawnMatch);
  const matchState = useMatchStore((state) => state.state);
  const matchLoading = useMatchStore((state) => state.loading);

  const rituals = [
    {
      title: 'Treino Solo',
      detail: 'Carrega tabuleiro em modo offline para experimentar peças e movimentações.',
      action: () => spawnMatch(),
      disabled: matchLoading
    },
    {
      title: 'Criar Sala',
      detail: 'Gera código ritual para convidar outro jogador.',
      action: () => setView('create'),
      disabled: loadingRoom
    },
    {
      title: 'Entrar na Sala',
      detail: 'Insere código recebido para entrar diretamente na arena.',
      action: () => setView('join'),
      disabled: loadingRoom
    }
  ];

  const activePlayer = matchState?.activePlayer ? `Ativação: ${matchState.activePlayer}` : 'Nenhuma partida em andamento';

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1fr]">
      <ScenePanel title="Menu Principal" subtitle="Selecione a próxima cena do ritual.">
        <div className="flex flex-col gap-4">
          {rituals.map((ritual) => (
            <div
              key={ritual.title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-[var(--color-ember)]/60"
            >
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{ritual.title}</p>
                <p className="text-sm text-white/70">{ritual.detail}</p>
              </div>
              <SceneButton onClick={ritual.action} disabled={ritual.disabled}>
                {ritual.title}
              </SceneButton>
            </div>
          ))}
          <SceneButton variant="secondary" onClick={onOpenSettings}>
            Ajustar Configurações
          </SceneButton>
        </div>
      </ScenePanel>

      <ScenePanel title="Estado Atual" subtitle="Monitor ritual instantâneo." accent="aether">
        <SceneGrid>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Partida</p>
            <p className="text-lg font-semibold text-white">
              {matchState ? matchState.status : 'Nenhuma'}
            </p>
            <p className="text-sm text-white/60">{activePlayer}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Sala</p>
            {room ? (
              <>
                <p className="text-lg font-semibold text-white">{room.code}</p>
                <p className="text-sm text-white/60">{room.status}</p>
                {seat && <SceneTag>Você é {seat === 'host' ? 'Anfitrião' : 'Convidado'}</SceneTag>}
              </>
            ) : (
              <p className="text-lg text-white/70">Nenhuma sala sincronizada</p>
            )}
          </div>
        </SceneGrid>

        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-transparent p-4 text-sm text-white/70">
          <p>
            Este menu já renderiza o canvas Pixi quando um treino ou partida é iniciado. Nenhum conteúdo promocional é exibido — o foco está no jogo.
          </p>
        </div>
      </ScenePanel>
    </div>
  );
};

