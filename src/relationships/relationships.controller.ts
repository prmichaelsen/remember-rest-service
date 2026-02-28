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
  RelationshipService,
  type CreateRelationshipInput,
  type SearchRelationshipInput,
  type UpdateRelationshipInput,
} from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { ensureUserCollection } from '@prmichaelsen/remember-core/database/weaviate';
import { WEAVIATE_CLIENT, LOGGER } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import {
  CreateRelationshipDto,
  SearchRelationshipDto,
  UpdateRelationshipDto,
} from './relationships.dto.js';

@Controller('api/svc/v1/relationships')
export class RelationshipsController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  private async getService(userId: string): Promise<RelationshipService> {
    await ensureUserCollection(this.weaviateClient, userId);
    const collection = this.weaviateClient.collections.get(
      `Memory_users_${userId}`,
    );
    return new RelationshipService(collection, userId, this.logger);
  }

  @Post()
  async create(@User() userId: string, @Body() dto: CreateRelationshipDto) {
    const service = await this.getService(userId);
    return service.create(dto as CreateRelationshipInput);
  }

  @Post('search')
  async search(@User() userId: string, @Body() dto: SearchRelationshipDto) {
    const service = await this.getService(userId);
    return service.search(dto as SearchRelationshipInput);
  }

  @Patch(':id')
  async update(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    const service = await this.getService(userId);
    return service.update({
      ...dto,
      relationship_id: id,
    } as UpdateRelationshipInput);
  }

  @Delete(':id')
  async delete(@User() userId: string, @Param('id') id: string) {
    const service = await this.getService(userId);
    return service.delete({ relationship_id: id });
  }
}
