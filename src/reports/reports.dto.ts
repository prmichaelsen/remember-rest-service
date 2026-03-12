import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  memory_id: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ResolveReportDto {
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @IsOptional()
  @IsIn(['reviewed', 'resolved'])
  status?: 'reviewed' | 'resolved';
}

export class ListPendingQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
