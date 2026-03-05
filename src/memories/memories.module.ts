import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/index.js';
import { MemoriesController } from './memories.controller.js';

@Module({
  imports: [JobsModule],
  controllers: [MemoriesController],
})
export class MemoriesModule {}
