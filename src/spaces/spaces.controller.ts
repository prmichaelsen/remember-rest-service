import { Controller, Post, Body, Inject } from '@nestjs/common';
import {
  SpaceService,
  type ModerationClient,
  type MemoryIndexService,
  type PublishInput,
  type RetractInput,
  type ReviseInput,
  type ModerateInput,
  type SearchSpaceInput,
  type QuerySpaceInput,
  type DiscoverySpaceInput,
  type TimeSpaceInput,
  type RatingSpaceInput,
  type PropertySpaceInput,
  type BroadSpaceInput,
  type RandomSpaceInput,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { getCollectionName, CollectionType } from '@prmichaelsen/remember-core/collections';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MODERATION_CLIENT, MEMORY_INDEX, safeEnsureUserCollection } from '../core/core.providers.js';
import { Public, User } from '../auth/decorators.js';
import {
  PublishDto,
  RetractDto,
  ReviseDto,
  ModerateDto,
  SearchSpaceDto,
  QuerySpaceDto,
  DiscoverySpaceDto,
  TimeSpaceDto,
  RatingSpaceDto,
  PropertySpaceDto,
  BroadSpaceDto,
  RandomSpaceDto,
} from './spaces.dto.js';

@Controller('api/svc/v1/spaces')
export class SpacesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(CONFIRMATION_TOKEN_SERVICE) private readonly confirmationTokenService: any,
    @Inject(MODERATION_CLIENT) private readonly moderationClient: ModerationClient | null,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
  ) {}

  private async getService(userId: string): Promise<SpaceService> {
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

  private getPublicReadOnlyService(): SpaceService {
    const publicCollectionName = getCollectionName(CollectionType.SPACES);
    const publicCollection = this.weaviateClient.collections.get(publicCollectionName);
    return new SpaceService(
      this.weaviateClient,
      publicCollection,
      'anonymous',
      this.confirmationTokenService,
      this.logger,
      this.memoryIndex,
      { moderationClient: this.moderationClient ?? undefined },
    );
  }

  @Post('publish')
  async publish(@User() userId: string, @Body() dto: PublishDto) {
    const service = await this.getService(userId);
    return service.publish(dto as PublishInput);
  }

  @Post('retract')
  async retract(@User() userId: string, @Body() dto: RetractDto) {
    const service = await this.getService(userId);
    return service.retract(dto as RetractInput);
  }

  @Post('revise')
  async revise(@User() userId: string, @Body() dto: ReviseDto) {
    const service = await this.getService(userId);
    return service.revise(dto as ReviseInput);
  }

  @Post('moderate')
  async moderate(@User() userId: string, @Body() dto: ModerateDto) {
    const service = await this.getService(userId);
    return service.moderate(dto as ModerateInput);
  }

  @Public()
  @Post('search')
  async search(@User() userId: string, @Body() dto: SearchSpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.search(dto as SearchSpaceInput);
  }

  @Public()
  @Post('query')
  async query(@User() userId: string, @Body() dto: QuerySpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.query(dto as QuerySpaceInput);
  }

  @Public()
  @Post('by-discovery')
  async byDiscovery(@User() userId: string, @Body() dto: DiscoverySpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byDiscovery(dto as DiscoverySpaceInput);
  }

  @Public()
  @Post('by-time')
  async byTime(@User() userId: string, @Body() dto: TimeSpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byTime(dto as TimeSpaceInput);
  }

  @Public()
  @Post('by-rating')
  async byRating(@User() userId: string, @Body() dto: RatingSpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byRating(dto as RatingSpaceInput);
  }

  @Public()
  @Post('by-property')
  async byProperty(@User() userId: string, @Body() dto: PropertySpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byProperty(dto as PropertySpaceInput);
  }

  @Public()
  @Post('by-broad')
  async byBroad(@User() userId: string, @Body() dto: BroadSpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byBroad(dto as BroadSpaceInput);
  }

  @Public()
  @Post('by-random')
  async byRandom(@User() userId: string, @Body() dto: RandomSpaceDto) {
    const service = userId
      ? await this.getService(userId)
      : this.getPublicReadOnlyService();
    return service.byRandom(dto as RandomSpaceInput);
  }
}
