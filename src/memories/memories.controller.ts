import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  MemoryService,
  type CreateMemoryInput,
  type SearchMemoryInput,
  type FindSimilarInput,
  type QueryMemoryInput,
  type UpdateMemoryInput,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { fetchMemoryWithAllProperties } from '@prmichaelsen/remember-core/database/weaviate';
import { CollectionType, getCollectionName } from '@prmichaelsen/remember-core/collections';
import { WEAVIATE_CLIENT, LOGGER, safeEnsureUserCollection } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import {
  CreateMemoryDto,
  SearchMemoryDto,
  FindSimilarDto,
  QueryMemoryDto,
  UpdateMemoryDto,
  DeleteMemoryDto,
} from './memories.dto.js';

@Controller('api/svc/v1/memories')
export class MemoriesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  private resolveCollectionName(userId: string, source?: { author?: string; space?: string; group?: string }): string {
    if (source?.group) return getCollectionName(CollectionType.GROUPS, source.group);
    if (source?.space) return getCollectionName(CollectionType.SPACES);
    if (source?.author) return getCollectionName(CollectionType.USERS, source.author);
    return getCollectionName(CollectionType.USERS, userId);
  }

  private async getService(userId: string, source?: { author?: string; space?: string; group?: string }): Promise<MemoryService> {
    const collectionName = this.resolveCollectionName(userId, source);
    if (!source?.group && !source?.space) {
      await safeEnsureUserCollection(this.weaviateClient, source?.author ?? userId);
    }
    const collection = this.weaviateClient.collections.get(collectionName);
    return new MemoryService(collection, source?.author ?? userId, this.logger);
  }

  @Get(':id')
  async getById(
    @User() userId: string,
    @Param('id') id: string,
    @Query('author') author?: string,
    @Query('space') space?: string,
    @Query('group') group?: string,
  ) {
    const collectionName = this.resolveCollectionName(userId, { author, space, group });
    const collection = this.weaviateClient.collections.get(collectionName);
    const existing = await fetchMemoryWithAllProperties(collection, id);
    if (!existing?.properties) {
      throw new NotFoundException(`Memory not found: ${id}`);
    }

    return { memory: { id: existing.uuid, ...existing.properties } };
  }

  @Post()
  async create(@User() userId: string, @Body() dto: CreateMemoryDto) {
    const service = await this.getService(userId);
    return service.create(dto as CreateMemoryInput);
  }

  @Post('search')
  async search(@User() userId: string, @Body() dto: SearchMemoryDto) {
    const service = await this.getService(userId);
    return service.search(dto as SearchMemoryInput);
  }

  @Post('similar')
  async findSimilar(@User() userId: string, @Body() dto: FindSimilarDto) {
    const service = await this.getService(userId, { author: dto.author, space: dto.space, group: dto.group });
    return service.findSimilar(dto as FindSimilarInput);
  }

  @Post('query')
  async query(@User() userId: string, @Body() dto: QueryMemoryDto) {
    const service = await this.getService(userId);
    return service.query(dto as QueryMemoryInput);
  }

  @Patch(':id')
  async update(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemoryDto,
  ) {
    const service = await this.getService(userId);
    return service.update({ ...dto, memory_id: id } as UpdateMemoryInput);
  }

  @Delete(':id')
  async delete(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: DeleteMemoryDto,
  ) {
    const service = await this.getService(userId);
    return service.delete({ memory_id: id, reason: dto.reason });
  }
}
