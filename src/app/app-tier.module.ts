import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles/profiles.controller.js';
import { GhostSearchController } from './trust/ghost.controller.js';

@Module({
  controllers: [ProfilesController, GhostSearchController],
})
export class AppTierModule {}
