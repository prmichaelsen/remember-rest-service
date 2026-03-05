import {
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsString,
  IsArray,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  auto_suggest?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  suggestion_threshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_suggestions?: number;

  @IsOptional()
  @IsBoolean()
  show_preview?: boolean;

  @IsOptional()
  @IsBoolean()
  remember_choice?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suppressed_categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suppressed_templates?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  always_suggest?: string[];
}

export class SearchPreferencesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  default_limit?: number;

  @IsOptional()
  @IsBoolean()
  include_low_trust?: boolean;

  @IsOptional()
  @IsBoolean()
  weight_by_access?: boolean;

  @IsOptional()
  @IsBoolean()
  weight_by_recency?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  default_alpha?: number;
}

export class LocationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  auto_capture?: boolean;

  @IsOptional()
  @IsEnum(['exact', 'approximate', 'city', 'none'])
  precision?: string;

  @IsOptional()
  @IsBoolean()
  share_with_memories?: boolean;
}

export class PrivacyPreferencesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  default_trust_level?: number;

  @IsOptional()
  @IsBoolean()
  allow_cross_user_access?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_approve_requests?: boolean;

  @IsOptional()
  @IsBoolean()
  audit_logging?: boolean;
}

export class NotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  trust_violations?: boolean;

  @IsOptional()
  @IsBoolean()
  access_requests?: boolean;

  @IsOptional()
  @IsBoolean()
  memory_reminders?: boolean;

  @IsOptional()
  @IsBoolean()
  relationship_suggestions?: boolean;
}

export class DisplayPreferencesDto {
  @IsOptional()
  @IsString()
  date_format?: string;

  @IsOptional()
  @IsString()
  time_format?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplatePreferencesDto)
  templates?: TemplatePreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchPreferencesDto)
  search?: SearchPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPreferencesDto)
  location?: LocationPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacyPreferencesDto)
  privacy?: PrivacyPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DisplayPreferencesDto)
  display?: DisplayPreferencesDto;
}
