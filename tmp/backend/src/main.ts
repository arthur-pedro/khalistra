import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production',
    }),
  );

  await app.register(helmet);
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen({
    port: Number(process.env.PORT) || 3001,
    host: '0.0.0.0',
  });
}

void bootstrap();
