import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
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

  private async getService(userId: string): Promise<MemoryService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new MemoryService(collection, userId, this.logger);
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
    const service = await this.getService(userId);
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
