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
  enumerateAllCollections,
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
    const logger = this.logger;

    logger.info('Follow-up scan starting', { hasEventBus: !!this.eventBus });

    async function* collectionEnumerator() {
      let count = 0;
      for await (const collection of enumerateAllCollections(weaviateClient)) {
        count++;
        logger.info('Enumerating collection for follow-up scan', { collection, index: count });
        yield collection;
      }
      logger.info('Collection enumeration complete', { totalCollections: count });
    }

    const result = await scanAndNotifyFollowUps({
      weaviateClient,
      eventBus: this.eventBus,
      logger: this.logger,
      collectionEnumerator,
    });

    logger.info('Follow-up scan complete', {
      scanned: result.scanned,
      notified: result.notified,
      failed: result.failed,
    });

    return result;
  }
}
