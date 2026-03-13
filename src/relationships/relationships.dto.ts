import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsIn,
  Min,
  Max,
  IsEnum,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRelationshipDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memory_ids!: string[];

  @IsString()
  relationship_type!: string;

  @IsString()
  observation!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  strength?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  context_summary?: string;

  @IsOptional()
  @IsString()
  context_conversation_id?: string;

  @IsOptional()
  @IsIn(['user', 'rem', 'rule'])
  source?: string;
}

export class SearchRelationshipDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationship_types?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  strength_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_min?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  sort_direction?: string;
}

export class UpdateRelationshipDto {
  @IsOptional()
  @IsString()
  relationship_type?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  strength?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add_memory_ids?: string[];
}

// ─── Reorder Operation DTOs ─────────────────────────────────────────────────

export class MoveToIndexOperationDto {
  @IsIn(['move_to_index'])
  type!: 'move_to_index';

  @IsString()
  memory_id!: string;

  @IsInt()
  @Min(0)
  index!: number;
}

export class SwapOperationDto {
  @IsIn(['swap'])
  type!: 'swap';

  @IsString()
  memory_id_a!: string;

  @IsString()
  memory_id_b!: string;
}

export class SetOrderOperationDto {
  @IsIn(['set_order'])
  type!: 'set_order';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ordered_memory_ids!: string[];
}

export class MoveBeforeOperationDto {
  @IsIn(['move_before'])
  type!: 'move_before';

  @IsString()
  memory_id!: string;

  @IsString()
  before!: string;
}

export class MoveAfterOperationDto {
  @IsIn(['move_after'])
  type!: 'move_after';

  @IsString()
  memory_id!: string;

  @IsString()
  after!: string;
}

export type ReorderOperationDto =
  | MoveToIndexOperationDto
  | SwapOperationDto
  | SetOrderOperationDto
  | MoveBeforeOperationDto
  | MoveAfterOperationDto;

export class ReorderRelationshipDto {
  @ValidateNested()
  @Type(() => MoveToIndexOperationDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: MoveToIndexOperationDto, name: 'move_to_index' },
        { value: SwapOperationDto, name: 'swap' },
        { value: SetOrderOperationDto, name: 'set_order' },
        { value: MoveBeforeOperationDto, name: 'move_before' },
        { value: MoveAfterOperationDto, name: 'move_after' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  operation!: ReorderOperationDto;

  @IsInt()
  version!: number;
}
