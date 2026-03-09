import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';

export class CreateRelationshipDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
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
