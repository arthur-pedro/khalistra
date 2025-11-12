import { applyMove, createInitialState, isKingInCheck, listLegalMoves } from '../src';
import type { GameStateSnapshot, MoveCommand, PieceState, PlayerId, Vector2 } from '../src';

const players: [PlayerId, PlayerId] = ['light', 'shadow'];

const findPiece = (state: GameStateSnapshot, predicate: (piece: PieceState) => boolean) => {
  const piece = state.pieces.find(predicate);
  if (!piece) {
    throw new Error('Peça necessária para o teste não encontrada');
  }
  return piece;
};

const cloneState = (state: GameStateSnapshot, overrides: Partial<GameStateSnapshot>): GameStateSnapshot => ({
  ...state,
  ...overrides
});

describe('@khalistra/game-engine', () => {
  it('cria o estado clássico 8x8 com todas as peças', () => {
    const state = createInitialState({ matchId: 'match-001', players });

    expect(state.boardSize).toBe(8);
    expect(state.pieces).toHaveLength(32);
    expect(state.pieces.filter((piece) => piece.type === 'pawn')).toHaveLength(16);
    expect(state.history).toHaveLength(0);
    expect(state.activePlayer).toBe(players[0]);
    expect(state.status).toBe('in-progress');
  });

  it('aplica um movimento válido de peão e alterna o turno', () => {
    const state = createInitialState({ matchId: 'match-002', players });
    const pawn = findPiece(
      state,
      (piece) => piece.ownerId === players[0] && piece.type === 'pawn' && piece.position.x === 4
    );

    const command: MoveCommand = {
      pieceId: pawn.id,
      to: { x: pawn.position.x, y: pawn.position.y + 1 }
    };

    const updated = applyMove(state, command);

    const moved = findPiece(updated, (piece) => piece.id === pawn.id);
    expect(moved.position).toEqual(command.to);
    expect(updated.activePlayer).toBe(players[1]);
    expect(updated.turn).toBe(state.turn + 1);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0]).toMatchObject({ pieceId: pawn.id, to: command.to });
  });

  it('impede ações fora de turno', () => {
    const state = createInitialState({ matchId: 'match-003', players });
    const knight = findPiece(state, (piece) => piece.ownerId === players[1] && piece.type === 'knight');

    const command: MoveCommand = {
      pieceId: knight.id,
      to: { x: knight.position.x, y: knight.position.y - 2 }
    };

    expect(() => applyMove(state, command)).toThrow('Não é o turno deste jogador.');
  });

  it('bloqueia movimentos que deixariam o rei em xeque', () => {
    const base = createInitialState({ matchId: 'match-004', players });
    const whiteKing = findPiece(base, (piece) => piece.ownerId === players[0] && piece.type === 'king');
    const blackKing = findPiece(base, (piece) => piece.ownerId === players[1] && piece.type === 'king');
    const whiteRook = findPiece(base, (piece) => piece.ownerId === players[0] && piece.type === 'rook');
    const blackRook = findPiece(base, (piece) => piece.ownerId === players[1] && piece.type === 'rook');

    const customState: GameStateSnapshot = cloneState(base, {
      pieces: [
        { ...whiteKing, position: { x: 4, y: 0 } },
        { ...blackKing, position: { x: 0, y: 7 } },
        { ...whiteRook, position: { x: 4, y: 1 } },
        { ...blackRook, position: { x: 4, y: 7 } }
      ],
      history: [],
      turn: 5,
      activePlayer: players[0],
      checkedPlayerId: undefined,
      resolution: undefined,
      winnerId: undefined
    });

    const moves = listLegalMoves(customState, whiteRook.id);
    expect(moves.every((move) => move.to.x === 4)).toBe(true);

    const illegalCommand: MoveCommand = {
      pieceId: whiteRook.id,
      to: { x: 5, y: 1 }
    };

    expect(() => applyMove(customState, illegalCommand)).toThrow('Movimento inválido para esta peça.');
  });

  it('promove peões automaticamente ao alcançar a última fileira', () => {
    const base = createInitialState({ matchId: 'match-005', players });
    const whiteKing = findPiece(base, (piece) => piece.ownerId === players[0] && piece.type === 'king');
    const blackKing = findPiece(base, (piece) => piece.ownerId === players[1] && piece.type === 'king');
    const pawn = findPiece(base, (piece) => piece.ownerId === players[0] && piece.type === 'pawn');

    const customState: GameStateSnapshot = cloneState(base, {
      pieces: [
        { ...whiteKing, position: { x: 4, y: 0 } },
        { ...blackKing, position: { x: 7, y: 7 } },
        { ...pawn, position: { x: 0, y: 6 } }
      ],
      history: [],
      turn: 15,
      activePlayer: players[0],
      checkedPlayerId: undefined,
      resolution: undefined,
      winnerId: undefined
    });

    const promotedState = applyMove(customState, {
      pieceId: pawn.id,
      to: { x: 0, y: 7 }
    });

    const promotedPiece = findPiece(promotedState, (piece) => piece.id === pawn.id);
    expect(promotedPiece.type).toBe('queen');
    expect(promotedPiece.label).toBe('Rainha');
    expect(promotedState.history.at(-1)?.promotion).toBe('queen');
  });

  it('identifica xeque-mate clássico (Mate do Louco)', () => {
    let state = createInitialState({ matchId: 'match-006', players });

    const moveSequence: Array<{ owner: PlayerId; to: Vector2; piece: (s: GameStateSnapshot) => PieceState }> = [
      {
        owner: players[0],
        to: { x: 5, y: 2 },
        piece: (snapshot) =>
          findPiece(snapshot, (piece) => piece.ownerId === players[0] && piece.type === 'pawn' && piece.position.x === 5)
      },
      {
        owner: players[1],
        to: { x: 4, y: 4 },
        piece: (snapshot) =>
          findPiece(snapshot, (piece) => piece.ownerId === players[1] && piece.type === 'pawn' && piece.position.x === 4)
      },
      {
        owner: players[0],
        to: { x: 6, y: 3 },
        piece: (snapshot) =>
          findPiece(snapshot, (piece) => piece.ownerId === players[0] && piece.type === 'pawn' && piece.position.x === 6)
      },
      {
        owner: players[1],
        to: { x: 7, y: 3 },
        piece: (snapshot) =>
          findPiece(snapshot, (piece) => piece.ownerId === players[1] && piece.type === 'queen')
      }
    ];

    for (const step of moveSequence) {
      const piece = step.piece(state);
      state = applyMove(state, {
        pieceId: piece.id,
        to: step.to
      });
    }

    expect(state.status).toBe('completed');
    expect(state.resolution?.reason).toBe('checkmate');
    expect(state.winnerId).toBe(players[1]);
    expect(state.history.at(-1)?.checkmate).toBe(true);
    expect(isKingInCheck(state, players[0])).toBe(true);
  });
});
