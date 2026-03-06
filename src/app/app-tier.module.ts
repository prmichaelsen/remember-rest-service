import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles/profiles.controller.js';
import { GhostSearchController } from './trust/ghost.controller.js';
import { AppMemoriesController } from './memories/app-memories.controller.js';
import { AppRelationshipsController } from './relationships/app-relationships.controller.js';
import { AppSpacesController } from './spaces/app-spaces.controller.js';

@Module({
  controllers: [ProfilesController, GhostSearchController, AppMemoriesController, AppRelationshipsController, AppSpacesController],
})
export class AppTierModule {}
