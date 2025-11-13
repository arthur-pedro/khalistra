import type { GameStateSnapshot, LegalMove, Vector2 } from '@khalistra/game-engine';

export interface PixiBoardCallbacks {
  onSelectPiece: (pieceId?: string) => void;
  onSubmitMove: (pieceId: string, target: Vector2) => void;
}

export interface PixiBoardOptions extends PixiBoardCallbacks {
  container: HTMLDivElement;
  disabled?: boolean;
}

export interface PixiBoardSyncPayload {
  state?: GameStateSnapshot;
  legalMoves: LegalMove[];
  selectedPieceId?: string;
  disabled?: boolean;
}

export interface PixiBoardRenderer {
  sync: (payload: PixiBoardSyncPayload) => void;
  destroy: () => void;
}
