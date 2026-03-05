import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  MemoryResolutionService,
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

  private getResolutionService(userId: string): MemoryResolutionService {
    return new MemoryResolutionService(this.weaviateClient, userId, this.logger);
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
    const resolver = this.getResolutionService(userId);
    await safeEnsureUserCollection(this.weaviateClient, userId);

    const resolved = await resolver.resolve(memoryId);
    if (!resolved) {
      throw new NotFoundException(`Memory not found: ${memoryId}`);
    }

    const shouldIncludeRelationships = includeRelationships === 'true';
    if (!shouldIncludeRelationships) {
      return { memory: resolved.memory, relationships: [] };
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
              const relResolved = await resolver.resolve(id);
              if (!relResolved) return null;
              const mem = relResolved.memory;
              const title = (mem.title as string) ||
                ((mem.content as string) ?? '').slice(0, 80);
              const authorId = (mem.author_id as string) ||
                (mem.owner_id as string) ||
                (mem.user_id as string) || '';
              return {
                memory_id: (mem.id as string) ?? id,
                title,
                author_id: authorId,
                space_ids: (mem.space_ids as string[]) ?? [],
                group_ids: (mem.group_ids as string[]) ?? [],
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
          id: rel.id as string,
          relationship_type: (rel.relationship_type as string) ?? '',
          observation: (rel.observation as string) ?? '',
          strength: (rel.strength as number) ?? 0,
          confidence: (rel.confidence as number) ?? 0,
          source: (rel.source as string) ?? 'rem',
          memory_count: relMemoryIds.length,
          memory_previews: validPreviews,
        };
      }),
    );

    return {
      memory: resolved.memory,
      relationships: relationshipsWithPreviews,
    };
  }
}
