import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller.js';

@Module({
  controllers: [SpacesController],
})
export class SpacesModule {}
