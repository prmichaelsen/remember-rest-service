import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsObject,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight_max?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  trust_min?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  trust_max?: number;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsBoolean()
  has_relationships?: boolean;
}

export class GhostSearchContextDto {
  @IsInt()
  @Min(1)
  @Max(5)
  accessor_trust_level!: number;

  @IsString()
  owner_user_id!: string;

  @IsOptional()
  @IsBoolean()
  include_ghost_content?: boolean;
}

export class CreateMemoryDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  trust?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @IsOptional()
  @IsString()
  template_id?: string;

  @IsOptional()
  @IsString()
  parent_id?: string | null;

  @IsOptional()
  @IsString()
  thread_root_id?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moderation_flags?: string[];

  @IsOptional()
  @IsString()
  context_summary?: string;

  @IsOptional()
  @IsString()
  context_conversation_id?: string;
}

export class SearchMemoryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  alpha?: number;

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
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsBoolean()
  include_relationships?: boolean;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class FindSimilarDto {
  @IsOptional()
  @IsString()
  memory_id?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_similarity?: number;

  @IsOptional()
  @IsBoolean()
  include_relationships?: boolean;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  space?: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class QueryMemoryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_relevance?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  trust?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @IsOptional()
  @IsString()
  parent_id?: string | null;

  @IsOptional()
  @IsString()
  thread_root_id?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moderation_flags?: string[];
}

export class DeleteMemoryDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TimeModeDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class TimeSliceModeDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;
}

export class DensitySliceModeDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;
}

export class DensityModeDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_relationship_count?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class RateMemoryDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class RatingModeDto {
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class DiscoveryModeDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;

  @IsOptional()
  @IsString()
  query?: string;
}

export class CuratedModeDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class RecommendationModeDto {
  @IsOptional()
  @IsString()
  query?: string;

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
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class PropertyModeDto {
  @IsString()
  sort_field!: string;

  @IsEnum(['asc', 'desc'])
  sort_direction!: 'asc' | 'desc';

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
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class BroadModeDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class RandomModeDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}

export class ImportItemDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsString()
  source_filename?: string;
}

export class ImportMemoriesDto {
  @ValidateNested({ each: true })
  @Type(() => ImportItemDto)
  @ArrayMinSize(1)
  @IsArray()
  items!: ImportItemDto[];

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  chunk_size?: number;

  @IsOptional()
  @IsString()
  context_conversation_id?: string;
}
