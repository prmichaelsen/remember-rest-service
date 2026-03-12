import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/index.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [JobsModule],
  controllers: [UsersController],
})
export class UsersModule {}
