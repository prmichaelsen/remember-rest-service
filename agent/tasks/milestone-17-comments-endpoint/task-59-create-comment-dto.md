# Task 59: Create Comment DTO

## Objective

Create `CreateCommentDto` with class-validator decorators matching the OpenAPI `CreateCommentInput` schema.

## Steps

1. Create `src/app/spaces/app-spaces.dto.ts`
2. Add `CreateCommentDto`:
   - `@IsString() content` (required)
   - `@IsString() parent_id` (required)
   - `@IsOptional() @IsString() thread_root_id?`
   - `@IsOptional() @IsArray() @IsString({ each: true }) spaces?`
   - `@IsOptional() @IsArray() @IsString({ each: true }) groups?`
   - `@IsOptional() @IsArray() @IsString({ each: true }) tags?`

## Verification

- [ ] DTO file created at `src/app/spaces/app-spaces.dto.ts`
- [ ] All fields match OpenAPI spec
- [ ] class-validator decorators applied
