import {
  Controller,
  Post,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  MemoryService,
  SpaceService,
  type ModerationClient,
  type MemoryIndexService,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MODERATION_CLIENT, MEMORY_INDEX, safeEnsureUserCollection } from '../../core/core.providers.js';
import { User } from '../../auth/decorators.js';
import { CreateCommentDto } from './app-spaces.dto.js';

@Controller('api/app/v1/spaces')
export class AppSpacesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(CONFIRMATION_TOKEN_SERVICE) private readonly confirmationTokenService: any,
    @Inject(MODERATION_CLIENT) private readonly moderationClient: ModerationClient | null,
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

  private async getSpaceService(userId: string): Promise<SpaceService> {
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

  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @User() userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const spaceService = await this.getSpaceService(userId);

    // Infer spaces/groups from parent memory when not provided
    let spaces = dto.spaces;
    let groups = dto.groups;
    if (!spaces?.length && !groups?.length) {
      const locations = await spaceService.getPublishedLocations(dto.parent_id);
      spaces = locations.space_ids;
      groups = locations.group_ids;
      if (!spaces.length && !groups.length) {
        throw new BadRequestException('Parent memory is not published to any space or group');
      }
    }

    const memoryService = await this.getMemoryService(userId);

    // 1. Create the comment memory
    const memory = await memoryService.create({
      content: dto.content,
      type: 'comment' as any,
      parent_id: dto.parent_id,
      thread_root_id: dto.thread_root_id ?? dto.parent_id,
      tags: dto.tags ?? [],
    });

    // 2. Publish to spaces/groups (auto-confirmed)
    const { token } = await spaceService.publish({
      memory_id: memory.memory_id,
      spaces,
      groups,
    });
    const confirmed = await spaceService.confirm({ token });

    return {
      memory_id: memory.memory_id,
      created_at: memory.created_at,
      composite_id: confirmed.composite_id,
      published_to: [
        ...(spaces ?? []),
        ...(groups ?? []),
      ],
    };
  }
}
