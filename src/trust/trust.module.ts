import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller.js';

@Module({
  controllers: [TrustController],
})
export class TrustModule {}
