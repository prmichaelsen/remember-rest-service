import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublishDto {
  @IsString()
  memory_id!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spaces?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additional_tags?: string[];
}

export class RetractDto {
  @IsString()
  memory_id!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spaces?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];
}

export class ReviseDto {
  @IsString()
  memory_id!: string;
}

export class ModerateDto {
  @IsString()
  memory_id!: string;

  @IsOptional()
  @IsString()
  space_id?: string;

  @IsOptional()
  @IsString()
  group_id?: string;

  @IsEnum(['approve', 'reject', 'remove'])
  action!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SearchSpaceDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spaces?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  @IsOptional()
  @IsEnum(['hybrid', 'bm25', 'semantic'])
  search_type?: string;

  @IsOptional()
  @IsString()
  content_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  max_weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rating_min?: number;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsEnum(['approved', 'pending', 'rejected', 'removed', 'all'])
  moderation_filter?: string;

  @IsOptional()
  @IsBoolean()
  include_comments?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class QuerySpaceDto {
  @IsString()
  question!: string;

  @IsArray()
  @IsString({ each: true })
  spaces!: string[];

  @IsOptional()
  @IsString()
  content_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_weight?: number;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsEnum(['approved', 'pending', 'rejected', 'removed', 'all'])
  moderation_filter?: string;

  @IsOptional()
  @IsBoolean()
  include_comments?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DedupeOptionsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  viewingGroupId?: string;
}

export class DiscoverySpaceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spaces?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  @IsOptional()
  @IsString()
  content_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  max_weight?: number;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsEnum(['approved', 'pending', 'rejected', 'removed', 'all'])
  moderation_filter?: string;

  @IsOptional()
  @IsBoolean()
  include_comments?: boolean;

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
  @Type(() => DedupeOptionsDto)
  dedupe?: DedupeOptionsDto;
}
