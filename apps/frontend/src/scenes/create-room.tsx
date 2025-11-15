'use client';

import { FormEvent, useState } from 'react';
import { SceneButton, SceneInput, ScenePanel } from './components';
import { useRoomStore } from '../state/room-store';

interface CreateRoomSceneProps {
  onBack: () => void;
}

export const CreateRoomScene = ({ onBack }: CreateRoomSceneProps) => {
  const [codename, setCodename] = useState('');

  const createRoom = useRoomStore((state) => state.createRoom);
  const loading = useRoomStore((state) => state.loading);
  const error = useRoomStore((state) => state.error);
  const clearError = useRoomStore((state) => state.clearError);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    const trimmed = codename.trim();
    if (!trimmed) {
      return;
    }
    void createRoom(trimmed);
  };

  return (
    <ScenePanel title="Criar Sala" subtitle="Defina seu codinome para gerar um ritual privado.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SceneInput
          label="Codinome"
          placeholder="Ex.: Arcanista Solenne"
          value={codename}
          onChange={(event) => {
            if (error) {
              clearError();
            }
            setCodename(event.target.value);
          }}
          disabled={loading}
        />
        {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-4">
          <SceneButton type="submit" disabled={loading}>
            Gerar Código
          </SceneButton>
          <SceneButton type="button" variant="ghost" onClick={onBack}>
            Voltar ao Menu
          </SceneButton>
        </div>
      </form>
    </ScenePanel>
  );
};

