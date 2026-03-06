import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
  ConflictException,
} from '@nestjs/common';
import {
  MemoryService,
  SpaceService,
  type MemoryIndexService,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MEMORY_INDEX, safeEnsureUserCollection } from '../../core/core.providers.js';
import { User } from '../../auth/decorators.js';
import {
  CreateProfileDto,
  UpdateProfileDto,
  SearchProfilesDto,
} from './profiles.dto.js';

const PROFILES_SPACE = 'profiles';

@Controller('api/app/v1/profiles')
export class ProfilesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(CONFIRMATION_TOKEN_SERVICE) private readonly confirmationTokenService: any,
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
    );
  }

  @Post()
  async createAndPublish(
    @User() userId: string,
    @Body() dto: CreateProfileDto,
  ) {
    const memoryService = await this.getMemoryService(userId);
    const spaceService = await this.getSpaceService(userId);

    // Singleton check: one profile per user
    const existing = await spaceService.search({
      query: userId,
      spaces: [PROFILES_SPACE],
      content_type: 'profile',
      limit: 1,
    });
    if (existing.memories.length > 0) {
      throw new ConflictException(
        'User already has a published profile. Use PATCH to update.',
      );
    }

    // Build profile content
    const content = buildProfileContent(dto.display_name, dto.bio, dto.tags);

    // Create memory
    const memory = await memoryService.create({
      content,
      type: 'profile' as any,
      tags: dto.tags ?? [],
    });

    // Publish to profiles space (auto-confirmed)
    const { token } = await spaceService.publish({
      memory_id: memory.memory_id,
      spaces: [PROFILES_SPACE],
    });
    const confirmed = await spaceService.confirm({ token });

    return {
      memory_id: memory.memory_id,
      space_id: PROFILES_SPACE,
      composite_id: confirmed.composite_id,
    };
  }

  @Patch(':memoryId')
  async updateAndRepublish(
    @User() userId: string,
    @Param('memoryId') memoryId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const memoryService = await this.getMemoryService(userId);
    const spaceService = await this.getSpaceService(userId);

    // Build updated content
    const updateFields: Record<string, unknown> = {};
    if (dto.display_name || dto.bio) {
      updateFields.content = buildProfileContent(
        dto.display_name ?? '',
        dto.bio,
        dto.tags,
      );
    }
    if (dto.tags) {
      updateFields.tags = dto.tags;
    }

    // Update memory
    await memoryService.update({
      memory_id: memoryId,
      content: updateFields.content as string | undefined,
      tags: updateFields.tags as string[] | undefined,
    });

    // Revise in profiles space (auto-confirmed)
    const { token } = await spaceService.revise({ memory_id: memoryId });
    await spaceService.confirm({ token });

    return {
      memory_id: memoryId,
      composite_id: undefined,
    };
  }

  @Delete(':memoryId')
  async retract(
    @User() userId: string,
    @Param('memoryId') memoryId: string,
  ) {
    const spaceService = await this.getSpaceService(userId);

    // Retract from profiles space (auto-confirmed)
    const { token } = await spaceService.retract({
      memory_id: memoryId,
      spaces: [PROFILES_SPACE],
    });
    await spaceService.confirm({ token });

    return { retracted: true };
  }

  @Post('search')
  async search(
    @User() userId: string,
    @Body() dto: SearchProfilesDto,
  ) {
    const spaceService = await this.getSpaceService(userId);

    const limit = dto.limit ?? 10;
    const offset = dto.offset ?? 0;

    const result = await spaceService.search({
      query: dto.query,
      spaces: [PROFILES_SPACE],
      content_type: 'profile',
      limit,
      offset,
    });

    const profiles = result.memories.map((raw: Record<string, unknown>) => {
      const compositeId = (raw.composite_id ?? '') as string;
      const parts = compositeId.split(':');
      const profileUserId = parts.length >= 2
        ? parts[1]
        : (raw.user_id ?? raw.author_id ?? '') as string;

      return {
        user_id: profileUserId,
        display_name: extractDisplayName(raw),
        bio: extractBio(raw),
        tags: (raw.tags ?? []) as string[],
        similarity: 0,
        memory_id: (raw.id ?? raw.memory_id ?? '') as string,
        composite_id: compositeId,
      };
    });

    return {
      profiles,
      total: result.total,
      offset,
      limit,
      hasMore: offset + limit < result.total,
    };
  }
}

function buildProfileContent(
  displayName: string,
  bio?: string,
  tags?: string[],
): string {
  const parts = [`Name: ${displayName}`];
  if (bio) parts.push(`Bio: ${bio}`);
  if (tags && tags.length > 0) parts.push(`Tags: ${tags.join(', ')}`);
  return parts.join('\n');
}

function extractDisplayName(raw: Record<string, unknown>): string {
  const content = (raw.content ?? '') as string;
  const match = content.match(/^Name:\s*(.+)/m);
  return match ? match[1].trim() : (raw.title ?? '') as string;
}

function extractBio(raw: Record<string, unknown>): string | undefined {
  const content = (raw.content ?? '') as string;
  const match = content.match(/^Bio:\s*(.+)/m);
  return match ? match[1].trim() : undefined;
}
