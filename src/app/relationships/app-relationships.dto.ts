import {
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GetRelationshipMemoriesQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
