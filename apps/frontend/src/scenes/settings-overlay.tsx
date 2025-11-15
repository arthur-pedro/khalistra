'use client';

import { SceneButton, ScenePanel, SceneTag } from './components';

export interface GameSettingsState {
  audio: boolean;
  hints: boolean;
  telemetry: boolean;
}

interface SettingsOverlayProps {
  open: boolean;
  settings: GameSettingsState;
  onToggle: (key: keyof GameSettingsState) => void;
  onClose: () => void;
}

const options: Array<{ key: keyof GameSettingsState; label: string; description: string }> = [
  {
    key: 'audio',
    label: 'Áudio Ambiente',
    description: 'Ativa trilhas e efeitos básicos enquanto o Pixi renderiza o tabuleiro.'
  },
  {
    key: 'hints',
    label: 'Assistente de Jogadas',
    description: 'Exibe destaques nos movimentos legais retornados pelo engine.'
  },
  {
    key: 'telemetry',
    label: 'Enviar Telemetria',
    description: 'Compartilha métricas de UX com a forja de dados do Khalistra.'
  }
];

export const SettingsOverlay = ({ open, settings, onToggle, onClose }: SettingsOverlayProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl">
      <div className="mx-4 w-full max-w-2xl">
        <ScenePanel
          title="Configurações"
          subtitle="Os ajustes afetam apenas este cliente."
          actions={<SceneTag>Beta</SceneTag>}
        >
          <div className="space-y-4">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onToggle(option.key)}
                className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-[var(--color-ember)]/60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">{option.label}</p>
                    <p className="text-xs text-white/60">{option.description}</p>
                  </div>
                  <SceneTag tone={settings[option.key] ? 'positive' : 'warning'}>
                    {settings[option.key] ? 'Ligado' : 'Desligado'}
                  </SceneTag>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <SceneButton variant="outline" onClick={onClose}>
              Voltar
            </SceneButton>
          </div>
        </ScenePanel>
      </div>
    </div>
  );
};

