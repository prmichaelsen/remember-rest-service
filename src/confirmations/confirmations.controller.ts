import { Controller, Post, Param, Inject } from '@nestjs/common';
import { SpaceService } from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';

@Controller('api/svc/v1/confirmations')
export class ConfirmationsController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(CONFIRMATION_TOKEN_SERVICE) private readonly confirmationTokenService: any,
  ) {}

  private getService(userId: string): SpaceService {
    const userCollection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new SpaceService(
      this.weaviateClient,
      userCollection,
      userId,
      this.confirmationTokenService,
      this.logger,
    );
  }

  @Post(':token/confirm')
  async confirm(@User() userId: string, @Param('token') token: string) {
    const service = this.getService(userId);
    return service.confirm({ token });
  }

  @Post(':token/deny')
  async deny(@User() userId: string, @Param('token') token: string) {
    const service = this.getService(userId);
    return service.deny({ token });
  }
}
