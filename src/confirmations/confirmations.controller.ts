import { Controller, Post, Param, Inject } from '@nestjs/common';
import { SpaceService, type ModerationClient, type MemoryIndexService } from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MODERATION_CLIENT, MEMORY_INDEX, safeEnsureUserCollection } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';

@Controller('api/svc/v1/confirmations')
export class ConfirmationsController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(CONFIRMATION_TOKEN_SERVICE) private readonly confirmationTokenService: any,
    @Inject(MODERATION_CLIENT) private readonly moderationClient: ModerationClient | null,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
  ) {}

  private async getService(userId: string): Promise<SpaceService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const userCollection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new SpaceService(
      this.weaviateClient,
      userCollection,
      userId,
      this.confirmationTokenService,
      this.logger,
      this.memoryIndex,
      { moderationClient: this.moderationClient ?? undefined },
    );
  }

  @Post(':token/confirm')
  async confirm(@User() userId: string, @Param('token') token: string) {
    const service = await this.getService(userId);
    return service.confirm({ token });
  }

  @Post(':token/deny')
  async deny(@User() userId: string, @Param('token') token: string) {
    const service = await this.getService(userId);
    return service.deny({ token });
  }
}
