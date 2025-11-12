import type { PlayerId } from '@khalistra/game-engine';
import { MatchesService } from './matches.service';

const PLAYERS: [PlayerId, PlayerId] = ['player-a', 'player-b'];

describe('MatchesService', () => {
  let service: MatchesService;

  beforeEach(() => {
    service = new MatchesService();
  });

  it('creates and stores a new match state', () => {
    const state = service.createMatch({
      matchId: 'match-1',
      players: PLAYERS,
    });

    expect(state.matchId).toBe('match-1');
    expect(state.history).toHaveLength(0);
    expect(state.players).toEqual(PLAYERS);
    expect(() => service.getMatchState('match-1')).not.toThrow();
  });

  it('applies moves sequentially using the engine', () => {
    const state = service.createMatch({
      matchId: 'match-2',
      players: PLAYERS,
    });
    const activePiece = state.pieces.find(
      (piece) => piece.ownerId === PLAYERS[0] && piece.type === 'sentinel',
    );
    if (!activePiece) {
      throw new Error('Sentinel não encontrado');
    }

    const updated = service.submitMove('match-2', {
      pieceId: activePiece.id,
      to: { x: activePiece.position.x, y: activePiece.position.y + 1 },
    });

    expect(updated.turn).toBe(state.turn + 1);
    expect(updated.history).toHaveLength(1);
    expect(updated.pieces.find((piece) => piece.id === activePiece.id)?.position).toEqual({
      x: activePiece.position.x,
      y: activePiece.position.y + 1,
    });
    expect(updated.activePlayer).toBe(PLAYERS[1]);
  });
});
