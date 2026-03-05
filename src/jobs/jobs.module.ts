import { Module } from '@nestjs/common';
import { JobService } from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { JOB_SERVICE, LOGGER } from '../core/core.providers.js';
import { JobsController } from './jobs.controller.js';

@Module({
  controllers: [JobsController],
  providers: [
    {
      provide: JOB_SERVICE,
      useFactory: (logger: Logger) => new JobService({ logger }),
      inject: [LOGGER],
    },
  ],
  exports: [JOB_SERVICE],
})
export class JobsModule {}
