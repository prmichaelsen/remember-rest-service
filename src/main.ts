import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { AppErrorFilter, FallbackErrorFilter } from './filters/index.js';
import { LoggingInterceptor } from './interceptors/index.js';
import { LOGGER } from './core/index.js';
import { ConfigService } from './config/config.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());

  const logger = app.get(LOGGER);
  const configService = app.get(ConfigService);

  const corsOrigin = configService.corsConfig.origin;
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',').map((o) => o.trim()) : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  app.useGlobalFilters(
    new FallbackErrorFilter(logger),
    new AppErrorFilter(logger),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.serverConfig.port;
  await app.listen(port);
}

bootstrap();
