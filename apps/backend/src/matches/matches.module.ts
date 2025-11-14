import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesGateway } from './matches.gateway';
import { createMatchesEventEmitter, MATCHES_EVENT_EMITTER } from './matches.events';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchesGateway,
    {
      provide: MATCHES_EVENT_EMITTER,
      useFactory: createMatchesEventEmitter,
    },
  ],
  exports: [MatchesService],
})
export class MatchesModule {}
