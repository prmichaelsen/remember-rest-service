import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SearchAsGhostDto {
  @IsString()
  owner_user_id!: string;

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
  offset?: number;
}
