import {
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsString()
  parent_id!: string;

  @IsOptional()
  @IsString()
  thread_root_id?: string;

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
  tags?: string[];
}
