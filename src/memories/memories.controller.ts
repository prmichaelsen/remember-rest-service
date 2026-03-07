import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpCode,
  Res,
} from '@nestjs/common';
import {
  MemoryService,
  RelationshipService,
  RatingService,
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
  validateImportItems,
  type ExtractorRegistry,
  type DiscoveryModeRequest,
  type CuratedModeRequest,
  type RecommendationModeRequest,
  type PropertyModeRequest,
  type BroadModeRequest,
  type RandomModeRequest,
} from '@prmichaelsen/remember-core/services'
import type { RatingModeRequest } from '@prmichaelsen/remember-core/types';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { searchByTimeSlice, searchByDensitySlice } from '@prmichaelsen/remember-core/search';
import { fetchMemoryWithAllProperties } from '@prmichaelsen/remember-core/database/weaviate';
import { CollectionType, getCollectionName } from '@prmichaelsen/remember-core/collections';
import { WEAVIATE_CLIENT, LOGGER, HAIKU_CLIENT, JOB_SERVICE, MEMORY_INDEX, EXTRACTOR_REGISTRY, safeEnsureUserCollection } from '../core/core.providers.js';
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
  RateMemoryDto,
  RatingModeDto,
  DiscoveryModeDto,
  CuratedModeDto,
  RecommendationModeDto,
  PropertyModeDto,
  BroadModeDto,
  RandomModeDto,
} from './memories.dto.js';

@Controller('api/svc/v1/memories')
export class MemoriesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(HAIKU_CLIENT) private readonly haikuClient: HaikuClient | null,
    @Inject(JOB_SERVICE) private readonly jobService: JobService,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
    @Inject(EXTRACTOR_REGISTRY) private readonly extractorRegistry: ExtractorRegistry,
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
    @Query('include') include?: string,
  ) {
    let collectionName: string | null;
    try {
      collectionName = await this.memoryIndex.lookup(id);
    } catch (err) {
      this.logger.error?.('memoryIndex.lookup failed', { id, error: String(err) });
      throw new NotFoundException('Memory not found');
    }
    if (!collectionName) {
      throw new NotFoundException('Memory not found');
    }

    // Unauthenticated users can only access public space memories
    if (!userId && collectionName !== getCollectionName(CollectionType.SPACES)) {
      throw new NotFoundException('Memory not found');
    }

    const collection = this.weaviateClient.collections.get(collectionName);
    let existing: any;
    try {
      existing = await fetchMemoryWithAllProperties(collection, id);
    } catch (err) {
      this.logger.error?.('fetchMemoryWithAllProperties failed', { id, collectionName, error: String(err) });
      throw new NotFoundException('Memory not found');
    }
    if (!existing?.properties) {
      throw new NotFoundException('Memory not found');
    }

    const result: Record<string, unknown> = {
      memory: { id: existing.uuid, ...existing.properties },
    };

    if (include === 'similar' || include === 'both') {
      // Use the memory's own user_id so the ownership check in findSimilar passes
      const memoryOwner = (existing.properties as Record<string, unknown>).user_id as string;
      const service = new MemoryService(collection, memoryOwner ?? userId ?? 'anonymous', this.logger, {
        memoryIndex: this.memoryIndex,
        weaviateClient: this.weaviateClient,
      });
      try {
        const similar = await service.findSimilar({
          memory_id: id,
          limit: 5,
          min_similarity: 0.6,
        });
        result.similar_memories = similar.similar_memories ?? [];
      } catch (err) {
        this.logger.error?.('findSimilar failed', { id, error: String(err) });
        result.similar_memories = [];
      }
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

  private getRatingService(): RatingService {
    return new RatingService({
      weaviateClient: this.weaviateClient,
      memoryIndexService: this.memoryIndex,
      logger: this.logger,
    });
  }

  @Put(':id/rating')
  async rateMemory(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: RateMemoryDto,
  ) {
    const service = this.getRatingService();
    return service.rate({ memoryId: id, userId, rating: dto.rating });
  }

  @Delete(':id/rating')
  @HttpCode(204)
  async retractRating(
    @User() userId: string,
    @Param('id') id: string,
  ) {
    const service = this.getRatingService();
    await service.retract(id, userId);
  }

  @Get(':id/rating')
  async getMyRating(
    @User() userId: string,
    @Param('id') id: string,
  ) {
    const service = this.getRatingService();
    const rating = await service.getUserRating(id, userId);
    if (!rating) {
      throw new NotFoundException('No rating found');
    }
    return rating;
  }

  @Post('by-rating')
  async byRating(@User() userId: string, @Body() dto: RatingModeDto) {
    const service = await this.getService(userId);
    return service.byRating(dto as RatingModeRequest);
  }

  @Post('by-discovery')
  async byDiscovery(@User() userId: string, @Body() dto: DiscoveryModeDto) {
    const service = await this.getService(userId);
    return service.byDiscovery(dto as DiscoveryModeRequest);
  }

  @Post('by-curated')
  async byCurated(@User() userId: string, @Body() dto: CuratedModeDto) {
    const service = await this.getService(userId);
    return service.byCurated(dto as CuratedModeRequest);
  }

  @Post('by-recommendation')
  async byRecommendation(@User() userId: string, @Body() dto: RecommendationModeDto) {
    const service = await this.getService(userId);
    return service.byRecommendation({ ...dto, userId } as RecommendationModeRequest);
  }

  @Post('by-property')
  async byProperty(@User() userId: string, @Body() dto: PropertyModeDto) {
    const service = await this.getService(userId);
    return service.byProperty(dto as PropertyModeRequest);
  }

  @Post('by-broad')
  async byBroad(@User() userId: string, @Body() dto: BroadModeDto) {
    const service = await this.getService(userId);
    return service.byBroad(dto as BroadModeRequest);
  }

  @Post('by-random')
  async byRandom(@User() userId: string, @Body() dto: RandomModeDto) {
    const service = await this.getService(userId);
    return service.byRandom(dto as RandomModeRequest);
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

    const validationErrors = validateImportItems(dto.items, this.extractorRegistry);
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid import items',
        errors: validationErrors.map(e => ({ index: e.index, error: e.error })),
        supported_types: this.extractorRegistry.getSupportedMimeTypes(),
      });
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
      this.extractorRegistry,
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
