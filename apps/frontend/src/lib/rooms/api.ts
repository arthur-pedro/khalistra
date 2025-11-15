import type { RoomHandshakePayload, RoomSnapshot, RoomStartResponse } from '@khalistra/shared/types';
import type { MatchEnvelope } from '../api';
import { apiRequest } from '../api';

export interface RoomIdentityPayload {
  codename: string;
}

export const createRoomSession = (payload: RoomIdentityPayload): Promise<RoomHandshakePayload> =>
  apiRequest('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const joinRoomSession = (code: string, payload: RoomIdentityPayload): Promise<RoomHandshakePayload> =>
  apiRequest(`/rooms/${code}/join`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const fetchRoomSnapshot = (code: string): Promise<RoomSnapshot> => apiRequest(`/rooms/${code}`);

export const startRoomSessionMatch = (code: string, secret: string): Promise<RoomStartResponse<MatchEnvelope>> =>
  apiRequest(`/rooms/${code}/start`, {
    method: 'POST',
    body: JSON.stringify({ secret })
  });
