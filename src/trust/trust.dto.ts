import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class UpdateGhostConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  public_ghost_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  default_friend_trust?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  default_public_trust?: number;

  @IsOptional()
  @IsObject()
  per_user_trust?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blocked_users?: string[];

  @IsOptional()
  @IsEnum(['query', 'prompt', 'hybrid'])
  enforcement_mode?: string;
}

export class SetUserTrustDto {
  @IsString()
  target_user_id!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  trust_level!: number;
}

export class TargetUserDto {
  @IsString()
  target_user_id!: string;
}

export class CheckAccessDto {
  @IsString()
  memory_id!: string;

  @IsString()
  accessor_user_id!: string;
}
