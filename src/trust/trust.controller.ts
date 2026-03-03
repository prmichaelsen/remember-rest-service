import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Inject,
} from '@nestjs/common';
import {
  handleGetConfig,
  handleUpdateConfig,
  handleSetTrust,
  handleRemoveTrust,
  handleBlockUser,
  handleUnblockUser,
  checkMemoryAccess,
  FirestoreGhostConfigProvider,
  FirestoreEscalationStore,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import type { GhostConfig } from '@prmichaelsen/remember-core/types';
import { WEAVIATE_CLIENT, LOGGER, safeEnsureUserCollection } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import {
  UpdateGhostConfigDto,
  SetUserTrustDto,
  TargetUserDto,
  CheckAccessDto,
} from './trust.dto.js';

@Controller('api/svc/v1/trust')
export class TrustController {
  private readonly ghostConfigProvider: FirestoreGhostConfigProvider;
  private readonly escalationStore: FirestoreEscalationStore;

  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {
    this.ghostConfigProvider = new FirestoreGhostConfigProvider(logger);
    this.escalationStore = new FirestoreEscalationStore(logger);
  }

  @Get('ghost-config')
  async getGhostConfig(@User() userId: string) {
    return handleGetConfig(userId, this.logger);
  }

  @Patch('ghost-config')
  async updateGhostConfig(
    @User() userId: string,
    @Body() dto: UpdateGhostConfigDto,
  ) {
    return handleUpdateConfig(userId, dto as Partial<GhostConfig>, this.logger);
  }

  @Post('set-user-trust')
  async setUserTrust(@User() userId: string, @Body() dto: SetUserTrustDto) {
    return handleSetTrust(
      userId,
      dto.target_user_id,
      dto.trust_level,
      this.logger,
    );
  }

  @Post('remove-user-trust')
  async removeUserTrust(@User() userId: string, @Body() dto: TargetUserDto) {
    return handleRemoveTrust(userId, dto.target_user_id, this.logger);
  }

  @Post('block-user')
  async blockUser(@User() userId: string, @Body() dto: TargetUserDto) {
    return handleBlockUser(userId, dto.target_user_id, this.logger);
  }

  @Post('unblock-user')
  async unblockUser(@User() userId: string, @Body() dto: TargetUserDto) {
    return handleUnblockUser(userId, dto.target_user_id, this.logger);
  }

  @Post('check-access')
  async checkAccess(@User() userId: string, @Body() dto: CheckAccessDto) {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    const memoryObj = await collection.query.fetchObjectById(dto.memory_id, {
      returnProperties: [
        'content',
        'user_id',
        'trust',
        'weight',
        'type',
        'deleted_at',
        'tags',
      ],
    });

    if (!memoryObj) {
      return { status: 'not_found', message: 'Memory not found' };
    }

    const memory = {
      id: dto.memory_id,
      ...memoryObj.properties,
    };

    return checkMemoryAccess(
      dto.accessor_user_id,
      memory as any,
      this.ghostConfigProvider,
      this.escalationStore,
    );
  }
}
