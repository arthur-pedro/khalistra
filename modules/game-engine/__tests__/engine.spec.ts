import { applyMove, createInitialState, stateToUpdateEvent } from '../src';
import type { GameStateSnapshot, MoveCommand, PieceState } from '../src';

describe('@khalistra/game-engine', () => {
  const players: [string, string] = ['light', 'shadow'];

  it('cria um estado inicial simétrico', () => {
    const state = createInitialState({ matchId: 'match-001', players });

    expect(state.boardSize).toBeGreaterThan(0);
    expect(state.pieces).toHaveLength(10);
    expect(state.pieces.filter((piece) => piece.ownerId === players[0])).toHaveLength(5);
    expect(state.pieces.filter((piece) => piece.ownerId === players[1])).toHaveLength(5);
    expect(state.history).toHaveLength(0);
    expect(state.activePlayer).toBe(players[0]);
  });

  it('aplica um movimento válido e alterna o turno', () => {
    const state = createInitialState({ matchId: 'match-002', players });
    const sentinel = state.pieces.find((piece) => piece.id.startsWith('light.sentinel')) as PieceState;

    const command: MoveCommand = {
      pieceId: sentinel.id,
      to: { x: sentinel.position.x, y: sentinel.position.y + 1 }
    };

    const updated = applyMove(state, command);

    const movedPiece = updated.pieces.find((piece) => piece.id === sentinel.id) as PieceState;
    expect(movedPiece.position).toEqual(command.to);
    expect(updated.activePlayer).toBe(players[1]);
    expect(updated.turn).toBe(state.turn + 1);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0]).toMatchObject({ pieceId: sentinel.id, to: command.to });
  });

  it('impede ações fora de turno', () => {
    const state = createInitialState({ matchId: 'match-003', players });
    const sentinel = state.pieces.find((piece) => piece.id.startsWith('shadow.sentinel')) as PieceState;

    const command: MoveCommand = {
      pieceId: sentinel.id,
      to: { x: sentinel.position.x, y: sentinel.position.y - 1 }
    };

    expect(() => applyMove(state, command)).toThrow('Não é o turno deste jogador.');
  });

  it('declara vitória ao capturar peças alvo do ritual', () => {
    const base = createInitialState({ matchId: 'match-004', players });
    const attacker = base.pieces.find((piece) => piece.id.startsWith('light.oracle')) as PieceState;
    const defender = base.pieces.find((piece) => piece.id.startsWith('shadow.dancer')) as PieceState;

    const customState: GameStateSnapshot = {
      ...base,
      pieces: [
        { ...attacker, position: { x: 2, y: 2 } },
        { ...defender, position: { x: 3, y: 3 } }
      ],
      history: []
    };

    const updated = applyMove(customState, {
      pieceId: attacker.id,
      to: { x: 3, y: 3 }
    });

    expect(updated.winnerId).toBe(players[0]);
    expect(updated.status).toBe('completed');
    expect(updated.history.at(-1)?.capturedPieceId).toBe(defender.id);
  });

  it('projeta o estado em eventos compartilhados', () => {
    const state = createInitialState({ matchId: 'match-005', players });
    const event = stateToUpdateEvent(state);

    expect(event.name).toBe('game:update');
    expect(event.payload.matchId).toBe('match-005');
    expect(event.payload.state).toMatchObject({
      boardSize: state.boardSize,
      turn: state.turn,
      status: state.status
    });
    const projected = event.payload.state as { pieces: Array<Record<string, unknown>> };
    expect(projected.pieces[0]).toHaveProperty('ownerId');
  });
});
