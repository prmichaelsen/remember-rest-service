import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller.js';

@Module({
  controllers: [SchedulerController],
})
export class SchedulerModule {}
