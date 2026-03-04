import {
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GetMemoryQueryDto {
  @IsOptional()
  @IsBoolean()
  includeRelationships?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  relationshipMemoryLimit?: number;
}
