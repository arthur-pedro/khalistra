'use client';

import { FormEvent, useState } from 'react';
import { SceneButton, SceneGrid, SceneInput, ScenePanel } from './components';
import { useRoomStore } from '../state/room-store';

interface JoinRoomSceneProps {
  onBack: () => void;
}

export const JoinRoomScene = ({ onBack }: JoinRoomSceneProps) => {
  const [codename, setCodename] = useState('');
  const [code, setCode] = useState('');

  const joinRoom = useRoomStore((state) => state.joinRoom);
  const loading = useRoomStore((state) => state.loading);
  const error = useRoomStore((state) => state.error);
  const clearError = useRoomStore((state) => state.clearError);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedCodename = codename.trim();
    if (!trimmedCode || !trimmedCodename) {
      return;
    }
    void joinRoom(trimmedCode, trimmedCodename);
  };

  return (
    <ScenePanel title="Entrar na Sala" subtitle="Conecte-se à arena com um código ritual.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SceneGrid>
          <SceneInput
            label="Código da Sala"
            placeholder="ABCD"
            value={code}
            onChange={(event) => {
              if (error) {
                clearError();
              }
              setCode(event.target.value.toUpperCase());
            }}
            disabled={loading}
            maxLength={6}
          />
          <SceneInput
            label="Seu Codinome"
            placeholder="Ex.: Conjuradora Umbra"
            value={codename}
            onChange={(event) => {
              if (error) {
                clearError();
              }
              setCodename(event.target.value);
            }}
            disabled={loading}
          />
        </SceneGrid>
        {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-4">
          <SceneButton type="submit" disabled={loading}>
            Entrar
          </SceneButton>
          <SceneButton type="button" variant="ghost" onClick={onBack}>
            Voltar ao Menu
          </SceneButton>
        </div>
      </form>
    </ScenePanel>
  );
};

