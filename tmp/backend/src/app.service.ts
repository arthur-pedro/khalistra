import { Injectable } from '@nestjs/common';
import { buildGameEvent } from '@khalistra/shared/types';
import { GAME_EVENT_NAMESPACE } from '@khalistra/shared/constants';
import { logStructuredEvent } from '@khalistra/shared/utils';

@Injectable()
export class AppService {
  getHello(): string {
    const heartbeat = buildGameEvent('game:update', {
      matchId: 'health-check',
      state: { status: 'online' },
    });

    logStructuredEvent({
      action: `${GAME_EVENT_NAMESPACE}:heartbeat`,
      level: 'debug',
      context: heartbeat,
    });

    return 'Khalistra API online';
  }
}
