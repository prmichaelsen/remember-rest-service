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
  HttpCode,
  Res,
} from '@nestjs/common';
import {
  MemoryService,
  RelationshipService,
  ImportJobWorker,
  DEFAULT_TTL_HOURS,
  type MemoryIndexService,
  type JobService,
  type CreateMemoryInput,
  type SearchMemoryInput,
  type FindSimilarInput,
  type QueryMemoryInput,
  type UpdateMemoryInput,
  type TimeModeRequest,
  type DensityModeRequest,
  type HaikuClient,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { searchByTimeSlice, searchByDensitySlice } from '@prmichaelsen/remember-core/search';
import { fetchMemoryWithAllProperties } from '@prmichaelsen/remember-core/database/weaviate';
import { CollectionType, getCollectionName } from '@prmichaelsen/remember-core/collections';
import { WEAVIATE_CLIENT, LOGGER, HAIKU_CLIENT, JOB_SERVICE, MEMORY_INDEX, safeEnsureUserCollection } from '../core/core.providers.js';
import { Public, User } from '../auth/decorators.js';
import type { Response } from 'express';
import {
  CreateMemoryDto,
  SearchMemoryDto,
  FindSimilarDto,
  QueryMemoryDto,
  UpdateMemoryDto,
  DeleteMemoryDto,
  TimeModeDto,
  DensityModeDto,
  TimeSliceModeDto,
  DensitySliceModeDto,
  ImportMemoriesDto,
} from './memories.dto.js';

@Controller('api/svc/v1/memories')
export class MemoriesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(HAIKU_CLIENT) private readonly haikuClient: HaikuClient | null,
    @Inject(JOB_SERVICE) private readonly jobService: JobService,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
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
    return new MemoryService(collection, source?.author ?? userId, this.logger, {
      memoryIndex: this.memoryIndex,
      weaviateClient: this.weaviateClient,
    });
  }

  @Public()
  @Get(':id')
  async getById(
    @User() userId: string,
    @Param('id') id: string,
    @Query('author') author?: string,
    @Query('space') space?: string,
    @Query('group') group?: string,
    @Query('include') include?: string,
  ) {
    // Unauthenticated requests can only access public space memories
    if (!userId && !space) {
      space = 'public';
    }
    if (!userId && (author || group)) {
      throw new NotFoundException('Memory not found');
    }

    const source = { author, space, group };
    const collectionName = this.resolveCollectionName(userId ?? 'anonymous', source);
    const collection = this.weaviateClient.collections.get(collectionName);
    const existing = await fetchMemoryWithAllProperties(collection, id);
    if (!existing?.properties) {
      throw new NotFoundException(`Memory not found: ${id}`);
    }

    const result: Record<string, unknown> = {
      memory: { id: existing.uuid, ...existing.properties },
    };

    if (include === 'similar' || include === 'both') {
      const service = await this.getService(userId ?? 'anonymous', source);
      const similar = await service.findSimilar({
        memory_id: id,
        limit: 5,
        min_similarity: 0.6,
      });
      result.similar_memories = similar.similar_memories ?? [];
    }

    return result;
  }

  @Post()
  async create(@User() userId: string, @Body() dto: CreateMemoryDto) {
    const service = await this.getService(userId);
    return service.create(dto as CreateMemoryInput);
  }

  @Public()
  @Post('search')
  async search(@User() userId: string, @Body() dto: SearchMemoryDto) {
    // Unauthenticated requests search only the public space collection
    const source = userId ? undefined : { space: 'public' };
    const service = await this.getService(userId ?? 'anonymous', source);
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

  @Post('by-time')
  async byTime(@User() userId: string, @Body() dto: TimeModeDto) {
    const service = await this.getService(userId);
    return service.byTime(dto as TimeModeRequest);
  }

  @Post('by-density')
  async byDensity(@User() userId: string, @Body() dto: DensityModeDto) {
    const service = await this.getService(userId);
    return service.byDensity(dto as DensityModeRequest);
  }

  @Post('by-time-slice')
  async byTimeSlice(@User() userId: string, @Body() dto: TimeSliceModeDto) {
    const service = await this.getService(userId);
    return searchByTimeSlice(service, dto.query, {
      limit: dto.limit ?? 10,
      offset: dto.offset ?? 0,
      direction: dto.direction ?? 'desc',
      filters: dto.filters as Record<string, unknown> | undefined,
    });
  }

  @Post('by-density-slice')
  async byDensitySlice(@User() userId: string, @Body() dto: DensitySliceModeDto) {
    const service = await this.getService(userId);
    return searchByDensitySlice(service, dto.query, {
      limit: dto.limit ?? 10,
      offset: dto.offset ?? 0,
      direction: dto.direction ?? 'desc',
      filters: dto.filters as Record<string, unknown> | undefined,
    });
  }

  private async getRelationshipService(userId: string): Promise<RelationshipService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collectionName = getCollectionName(CollectionType.USERS, userId);
    const collection = this.weaviateClient.collections.get(collectionName);
    return new RelationshipService(collection, userId, this.logger);
  }

  @Post('import')
  @HttpCode(202)
  async importMemories(
    @User() userId: string,
    @Body() dto: ImportMemoriesDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.haikuClient) {
      throw new Error('Import requires ANTHROPIC_API_KEY to be configured');
    }

    const job = await this.jobService.create({
      type: 'import',
      user_id: userId,
      params: { items: dto.items, chunk_size: dto.chunk_size },
      ttl_hours: DEFAULT_TTL_HOURS.import,
    });

    res.header('Location', `/api/svc/v1/jobs/${job.id}`);

    const memoryService = await this.getService(userId);
    const relationshipService = await this.getRelationshipService(userId);
    const worker = new ImportJobWorker(
      this.jobService,
      memoryService,
      relationshipService,
      this.haikuClient,
      this.logger,
    );

    setImmediate(() => {
      worker.execute(job.id, userId, {
        items: dto.items,
        chunk_size: dto.chunk_size,
        context_conversation_id: dto.context_conversation_id,
      }).catch((err) => {
        this.logger.error?.('Import job failed', { job_id: job.id, error: String(err) });
      });
    });

    return { job_id: job.id };
  }
}
