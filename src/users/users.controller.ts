import { Controller, Delete, Param, Inject, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { AccountDeletionJobWorker, DEFAULT_TTL_HOURS } from '@prmichaelsen/remember-core/services';
import type { JobService } from '@prmichaelsen/remember-core/services';
import type { EventBus } from '@prmichaelsen/remember-core/webhooks';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { JOB_SERVICE, LOGGER, EVENT_BUS } from '../core/core.providers.js';

@Controller('api/svc/v1/users')
export class UsersController {
  constructor(
    @Inject(JOB_SERVICE) private readonly jobService: JobService,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus | null,
  ) {}

  @Delete(':userId')
  @HttpCode(202)
  async deleteUser(
    @Param('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const job = await this.jobService.create({
      type: 'account_deletion',
      user_id: userId,
      params: { user_id: userId },
      ttl_hours: DEFAULT_TTL_HOURS.account_deletion,
    });

    res.header('Location', `/api/svc/v1/jobs/${job.id}`);

    const worker = new AccountDeletionJobWorker(this.jobService, this.logger);

    setImmediate(() => {
      worker.execute(job.id, { user_id: userId }).catch((err) => {
        this.logger.error?.('Account deletion job failed', {
          job_id: job.id, error: String(err),
        });
      });
    });

    return { job_id: job.id, status: 'pending' as const };
  }
}
