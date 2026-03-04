import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  MemoryService,
  RelationshipService,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, safeEnsureUserCollection } from '../../core/core.providers.js';
import { User } from '../../auth/decorators.js';

@Controller('api/app/v1/memories')
export class AppMemoriesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  private async getMemoryService(userId: string): Promise<MemoryService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new MemoryService(collection, userId, this.logger);
  }

  private async getRelationshipService(userId: string): Promise<RelationshipService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new RelationshipService(collection, userId, this.logger);
  }

  @Get(':memoryId')
  async getMemory(
    @User() userId: string,
    @Param('memoryId') memoryId: string,
    @Query('includeRelationships') includeRelationships?: string,
    @Query('relationshipMemoryLimit') relationshipMemoryLimitStr?: string,
  ) {
    const memoryService = await this.getMemoryService(userId);

    const result = await memoryService.getById(memoryId);
    if (!result.memory) {
      throw new NotFoundException(`Memory not found: ${memoryId}`);
    }

    const shouldIncludeRelationships = includeRelationships === 'true';
    if (!shouldIncludeRelationships) {
      return { memory: result.memory, relationships: [] };
    }

    const relationshipMemoryLimit = Math.min(
      Math.max(parseInt(relationshipMemoryLimitStr || '5', 10) || 5, 1),
      10,
    );

    const relationshipService = await this.getRelationshipService(userId);
    const { relationships } = await relationshipService.findByMemoryIds({
      memory_ids: [memoryId],
    });

    const relationshipsWithPreviews = await Promise.all(
      relationships.map(async (rel: Record<string, unknown>) => {
        const relMemoryIds = (
          (rel.related_memory_ids as string[]) ?? (rel.memory_ids as string[]) ?? []
        ).filter((id: string) => id !== memoryId);

        const limitedIds = relMemoryIds.slice(0, relationshipMemoryLimit);

        const previews = await Promise.all(
          limitedIds.map(async (id: string) => {
            try {
              const memResult = await memoryService.getById(id);
              const mem = memResult.memory as Record<string, unknown>;
              const title = (mem.title as string) ||
                ((mem.content as string) ?? '').slice(0, 80);
              const authorId = (mem.author_id as string) ||
                (mem.owner_id as string) ||
                (mem.user_id as string) || '';
              return {
                memory_id: (mem.id as string) ?? id,
                title,
                author_id: authorId,
              };
            } catch {
              return null;
            }
          }),
        );

        const validPreviews = previews
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .sort((a, b) => a.title.localeCompare(b.title));

        return {
          ...rel,
          member_previews: validPreviews,
        };
      }),
    );

    return {
      memory: result.memory,
      relationships: relationshipsWithPreviews,
    };
  }
}
