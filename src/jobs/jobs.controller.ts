import {
  Controller,
  Get,
  Post,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import type { JobService } from '@prmichaelsen/remember-core/services';
import { JOB_SERVICE } from '../core/core.providers.js';

@Controller('api/svc/v1/jobs')
export class JobsController {
  constructor(@Inject(JOB_SERVICE) private readonly jobService: JobService) {}

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    const job = await this.jobService.getStatus(id);
    if (!job) {
      throw new NotFoundException(`Job not found: ${id}`);
    }
    return job;
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    const job = await this.jobService.getStatus(id);
    if (!job) {
      throw new NotFoundException(`Job not found: ${id}`);
    }
    await this.jobService.cancel(id);
    return { message: 'Job cancellation requested', job_id: id };
  }

  @Post('cleanup')
  async cleanup() {
    const deleted = await this.jobService.cleanupExpired();
    return { deleted };
  }
}
