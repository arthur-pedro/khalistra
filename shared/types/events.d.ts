export type GameEventName = 'game:join' | 'game:start' | 'game:move' | 'game:update' | 'game:finish';
export interface GameEventPayloads {
    'game:join': {
        matchId: string;
        playerId: string;
        rating?: number;
    };
    'game:start': {
        matchId: string;
        seed: string;
        firstPlayerId: string;
    };
    'game:move': {
        matchId: string;
        playerId: string;
        action: string;
        turn: number;
    };
    'game:update': {
        matchId: string;
        state: Record<string, unknown>;
    };
    'game:finish': {
        matchId: string;
        winnerId: string;
        reason: 'surrender' | 'checkmate' | 'timeout' | 'ritual';
    };
}
export type GameEvent<T extends GameEventName = GameEventName> = {
    name: T;
    payload: GameEventPayloads[T];
    timestamp: number;
};
export declare const buildGameEvent: <T extends GameEventName>(name: T, payload: GameEventPayloads[T]) => GameEvent<T>;
//# sourceMappingURL=events.d.ts.map