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
  type MemoryIndexService,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, MEMORY_INDEX, safeEnsureUserCollection } from '../../core/core.providers.js';
import { User } from '../../auth/decorators.js';

@Controller('api/app/v1/relationships')
export class AppRelationshipsController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
  ) {}

  private async getMemoryService(userId: string): Promise<MemoryService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new MemoryService(collection, userId, this.logger, {
      memoryIndex: this.memoryIndex,
      weaviateClient: this.weaviateClient,
    });
  }

  private async getRelationshipService(userId: string): Promise<RelationshipService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new RelationshipService(collection, userId, this.logger);
  }

  @Get(':relationshipId/memories')
  async getRelationshipMemories(
    @User() userId: string,
    @Param('relationshipId') relationshipId: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);
    const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0);

    const relationshipService = await this.getRelationshipService(userId);
    const result = await relationshipService.getById(relationshipId);

    if (!result.found) {
      throw new NotFoundException(`Relationship not found: ${relationshipId}`);
    }

    const relationship = result.relationship!;
    const memoryIds = (
      (relationship.related_memory_ids as string[]) ??
      (relationship.memory_ids as string[]) ??
      []
    );

    const memoryService = await this.getMemoryService(userId);

    const allMemories = await Promise.all(
      memoryIds.map(async (id: string) => {
        try {
          const memResult = await memoryService.getById(id);
          return memResult.memory as Record<string, unknown>;
        } catch {
          return null;
        }
      }),
    );

    const memberOrder = (relationship.member_order as Record<string, number>) ?? null;

    this.logger.debug('getRelationshipMemories: ordering context', {
      relationshipId,
      memoryIds,
      memberOrder,
      member_order_json: (relationship as any).member_order_json,
      hasMemberOrder: memberOrder !== null,
      totalMemoriesResolved: allMemories.filter(m => m !== null).length,
      totalMemoriesFailed: allMemories.filter(m => m === null).length,
    });

    const filtered = allMemories
      .filter((m): m is Record<string, unknown> => m !== null && !m.deleted_at)
      .sort((a, b) => {
        if (memberOrder) {
          const posA = memberOrder[a.id as string] ?? Number.MAX_SAFE_INTEGER;
          const posB = memberOrder[b.id as string] ?? Number.MAX_SAFE_INTEGER;
          this.logger.debug('getRelationshipMemories: sort comparison', {
            idA: a.id,
            posA,
            idB: b.id,
            posB,
          });
          return posA - posB;
        }
        const titleA = ((a.title as string) || (a.content as string) || '').toLowerCase();
        const titleB = ((b.title as string) || (b.content as string) || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });

    this.logger.debug('getRelationshipMemories: sorted order', {
      relationshipId,
      sortedIds: filtered.map(m => m.id),
      sortedPositions: memberOrder ? filtered.map(m => ({
        id: m.id,
        position: memberOrder[m.id as string],
      })) : 'no member_order, sorted alphabetically',
    });

    const total = filtered.length;
    const paginated: Array<Record<string, unknown>> = filtered.slice(offset, offset + limit).map((m, idx) => {
      const position = memberOrder ? (memberOrder[m.id as string] ?? offset + idx) : offset + idx;
      return { ...m, position };
    });

    const { related_memory_ids, memory_ids, member_order_json, ...relationshipMetadata } = relationship as any;

    this.logger.debug('getRelationshipMemories: final response', {
      relationshipId,
      total,
      paginatedCount: paginated.length,
      paginatedIds: paginated.map(m => ({ id: m.id, position: m.position })),
      has_more: offset + limit < total,
      responseMemberOrder: memberOrder ?? 'omitted',
    });

    return {
      relationship: {
        ...relationshipMetadata,
        memory_ids: memoryIds,
        ...(memberOrder ? { member_order: memberOrder } : {}),
      },
      memories: paginated,
      total,
      has_more: offset + limit < total,
    };
  }

  @Get(':relationshipId/ordered-content')
  async getOrderedContent(
    @User() userId: string,
    @Param('relationshipId') relationshipId: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);
    const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0);

    const relationshipService = await this.getRelationshipService(userId);
    const result = await relationshipService.getById(relationshipId);

    if (!result.found) {
      throw new NotFoundException(`Relationship not found: ${relationshipId}`);
    }

    const relationship = result.relationship!;
    const memoryIds = (
      (relationship.related_memory_ids as string[]) ??
      (relationship.memory_ids as string[]) ??
      []
    );

    const memoryService = await this.getMemoryService(userId);

    const allMemories = await Promise.all(
      memoryIds.map(async (id: string) => {
        try {
          const memResult = await memoryService.getById(id);
          return memResult.memory as Record<string, unknown>;
        } catch {
          return null;
        }
      }),
    );

    const memberOrder = (relationship.member_order as Record<string, number>) ?? null;

    const filtered = allMemories
      .filter((m): m is Record<string, unknown> => m !== null && !m.deleted_at)
      .sort((a, b) => {
        if (memberOrder) {
          const posA = memberOrder[a.id as string] ?? Number.MAX_SAFE_INTEGER;
          const posB = memberOrder[b.id as string] ?? Number.MAX_SAFE_INTEGER;
          return posA - posB;
        }
        return memoryIds.indexOf(a.id as string) - memoryIds.indexOf(b.id as string);
      });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit).map((m, idx) => {
      const _position = memberOrder ? (memberOrder[m.id as string] ?? offset + idx) : offset + idx;
      return { ...m, _position } as Record<string, unknown> & { _position: number };
    });

    const { related_memory_ids, memory_ids, member_order_json, ...relationshipMetadata } = relationship as any;

    return {
      relationship: {
        ...relationshipMetadata,
        memory_ids: memoryIds,
        ...(memberOrder ? { member_order: memberOrder } : {}),
      },
      items: paginated,
      total,
      has_more: offset + limit < total,
    };
  }
}
