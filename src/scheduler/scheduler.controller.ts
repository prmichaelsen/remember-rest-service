import {
  Controller,
  Post,
  HttpCode,
  Inject,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  scanAndNotifyFollowUps,
  getNextMemoryCollection,
} from '@prmichaelsen/remember-core/services';
import type { WeaviateClient } from 'weaviate-client';
import type { EventBus } from '@prmichaelsen/remember-core/webhooks';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, EVENT_BUS, LOGGER } from '../core/core.providers.js';
import { ConfigService } from '../config/config.service.js';
import { Public } from '../auth/decorators.js';

@Controller('api/internal/follow-ups')
export class SchedulerController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: WeaviateClient,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus | null,
    @Inject(LOGGER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('scan')
  @HttpCode(200)
  async scanFollowUps(
    @Headers('x-scheduler-secret') schedulerSecret?: string,
  ) {
    const expectedSecret = this.configService.schedulerConfig.secret;
    if (expectedSecret && schedulerSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing x-scheduler-secret header');
    }

    if (!this.eventBus) {
      this.logger.warn('Follow-up scan skipped: no EventBus configured (webhook URL/secret missing)');
      return { scanned: 0, notified: 0, failed: 0, skipped: true };
    }

    const weaviateClient = this.weaviateClient;

    async function* collectionEnumerator() {
      let cursor: string | null = null;
      let first: string | null = null;
      while (true) {
        const next = await getNextMemoryCollection(cursor);
        if (!next) break;
        if (first === null) first = next;
        else if (next === first) break;
        yield next;
        cursor = next;
      }
    }

    return scanAndNotifyFollowUps({
      weaviateClient,
      eventBus: this.eventBus,
      logger: this.logger,
      collectionEnumerator,
    });
  }
}
