import { Module } from '@nestjs/common';
import { ConfirmationsController } from './confirmations.controller.js';

@Module({
  controllers: [ConfirmationsController],
})
export class ConfirmationsModule {}
