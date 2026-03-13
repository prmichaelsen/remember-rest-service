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
import { WEAVIATE_CLIENT, LOGGER, safeEnsureUserCollection } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import {
  CreateRelationshipDto,
  SearchRelationshipDto,
  UpdateRelationshipDto,
  ReorderRelationshipDto,
} from './relationships.dto.js';

@Controller('api/svc/v1/relationships')
export class RelationshipsController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  private async getService(userId: string): Promise<RelationshipService> {
    await safeEnsureUserCollection(this.weaviateClient, userId);
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

  @Post(':id/reorder')
  async reorder(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: ReorderRelationshipDto,
  ) {
    this.logger.debug('reorder: incoming request', {
      userId,
      relationship_id: id,
      operation_type: dto.operation.type,
      operation: dto.operation,
      version: dto.version,
    });

    const service = await this.getService(userId);

    const reorderInput = {
      relationship_id: id,
      operation: dto.operation,
      version: dto.version,
    };
    this.logger.debug('reorder: calling service.reorder()', { reorderInput });

    try {
      const result = await (service as any).reorder(reorderInput);
      this.logger.debug('reorder: service returned successfully', {
        relationship_id: id,
        result_version: result?.version,
        member_order_length: result?.member_order?.length,
        member_order: result?.member_order,
        updated_at: result?.updated_at,
      });
      return result;
    } catch (error: any) {
      this.logger.debug('reorder: service threw error', {
        relationship_id: id,
        operation_type: dto.operation.type,
        error_message: error?.message,
        error_name: error?.name,
        error_code: error?.code,
      });
      throw error;
    }
  }

  @Delete(':id')
  async delete(@User() userId: string, @Param('id') id: string) {
    const service = await this.getService(userId);
    return service.delete({ relationship_id: id });
  }
}
