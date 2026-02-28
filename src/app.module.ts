import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from './config/index.js';
import { ConfigService } from './config/config.service.js';
import { CoreModule } from './core/index.js';
import { AuthModule } from './auth/index.js';
import { HealthModule } from './health/index.js';
import { MemoriesModule } from './memories/index.js';
import { RelationshipsModule } from './relationships/index.js';
import { SpacesModule } from './spaces/index.js';
import { ConfirmationsModule } from './confirmations/index.js';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.rateLimitConfig.windowMs,
            limit: configService.rateLimitConfig.max,
          },
        ],
      }),
    }),
    AuthModule,
    HealthModule,
    MemoriesModule,
    RelationshipsModule,
    SpacesModule,
    ConfirmationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
