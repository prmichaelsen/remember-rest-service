import {
  Controller,
  Post,
  Body,
  Inject,
} from '@nestjs/common';
import {
  MemoryService,
  FirestoreGhostConfigProvider,
  resolveAccessorTrustLevel,
  formatMemoryForPrompt,
  getTrustLevelLabel,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { DEFAULT_GHOST_CONFIG } from '@prmichaelsen/remember-core/types';
import { WEAVIATE_CLIENT, LOGGER, safeEnsureUserCollection } from '../../core/core.providers.js';
import { User } from '../../auth/decorators.js';
import { SearchAsGhostDto } from './ghost.dto.js';

@Controller('api/app/v1/trust')
export class GhostSearchController {
  private readonly ghostConfigProvider: FirestoreGhostConfigProvider;

  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {
    this.ghostConfigProvider = new FirestoreGhostConfigProvider(logger);
  }

  private async getOwnerMemoryService(ownerUserId: string): Promise<MemoryService> {
    await safeEnsureUserCollection(this.weaviateClient, ownerUserId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${ownerUserId}`,
    );
    return new MemoryService(collection, ownerUserId, this.logger);
  }

  @Post('search-as-ghost')
  async searchAsGhost(
    @User() userId: string,
    @Body() dto: SearchAsGhostDto,
  ) {
    // 1. Resolve ghost config for the memory owner
    const ghostConfig = await this.ghostConfigProvider.getGhostConfig(dto.owner_user_id);
    const config = ghostConfig ?? DEFAULT_GHOST_CONFIG;

    // 2. Resolve accessor (caller) trust level
    const accessorTrustLevel = resolveAccessorTrustLevel(config, userId);
    const trustTier = getTrustLevelLabel(accessorTrustLevel)
      .toLowerCase()
      .replace(/ /g, '_');

    // 3. Search owner's memories with ghost context
    const limit = dto.limit ?? 10;
    const offset = dto.offset ?? 0;
    const memoryService = await this.getOwnerMemoryService(dto.owner_user_id);
    const searchResult = await memoryService.search({
      query: dto.query,
      limit,
      offset,
      ghost_context: {
        accessor_trust_level: accessorTrustLevel,
        owner_user_id: dto.owner_user_id,
      },
    });

    // 4. Redact content based on trust tier
    const memories = searchResult.memories.map((raw: any) => {
      const formatted = formatMemoryForPrompt(
        raw,
        accessorTrustLevel,
        false, // not self-access
      );
      const tier = formatted.trust_tier.toLowerCase().replace(/ /g, '_');
      return {
        memory_id: formatted.memory_id,
        trust_tier: tier,
        content: formatted.content,
        tags: (raw.tags ?? []) as string[],
        access_level: formatted.trust_tier,
      };
    });

    return {
      memories,
      total: searchResult.total,
      offset,
      limit,
      hasMore: offset + limit < searchResult.total,
      trust_tier: trustTier,
    };
  }
}
