import { Module } from '@nestjs/common';
import { ConfigModule } from './config/index.js';
import { CoreModule } from './core/index.js';
import { HealthModule } from './health/index.js';

@Module({
  imports: [ConfigModule, CoreModule, HealthModule],
})
export class AppModule {}
