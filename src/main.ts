import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AppErrorFilter, FallbackErrorFilter } from './filters/index.js';
import { LOGGER } from './core/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(LOGGER);

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

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
}

bootstrap();
