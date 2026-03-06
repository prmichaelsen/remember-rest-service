# Task 56: Spaces byDiscovery Endpoint

**Milestone**: [M16 - byDiscovery REST Endpoints](../../milestones/milestone-16-by-discovery-rest.md)
**Estimated Time**: 0.5 hours
**Dependencies**: [Task 54](task-54-bump-remember-core.md)
**Status**: Not Started

---

## Objective

Add `POST /api/svc/v1/spaces/by-discovery` endpoint to SpacesController, delegating to `SpaceService.byDiscovery()`.

---

## Steps

### 1. Create DiscoverySpaceDto

Add to `src/spaces/spaces.dto.ts`:

```typescript
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
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

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
  created_after?: string;

  @IsOptional()
  @IsString()
  created_before?: string;

  @IsOptional()
  @IsString()
  moderation_filter?: string;

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
  @IsBoolean()
  dedupe?: boolean;
}
```

### 2. Add Controller Method

In `src/spaces/spaces.controller.ts`:

```typescript
@Public()
@Post('by-discovery')
async byDiscovery(@User() userId: string, @Body() dto: DiscoverySpaceDto) {
  const service = userId
    ? await this.getService(userId)
    : this.getPublicReadOnlyService();
  return service.byDiscovery(dto as DiscoverySpaceInput);
}
```

Follows the same `@Public()` pattern as `search` and `query` — accessible without auth but contextual when authenticated.

### 3. Add Imports

Add `DiscoverySpaceInput` to the remember-core imports in `spaces.controller.ts`.

---

## Verification

- [ ] `POST /spaces/by-discovery` returns interleaved results with `is_discovery` flag
- [ ] Works for both authenticated and anonymous users
- [ ] spaces/groups filtering works
- [ ] `tsc --noEmit` clean

---

**Next Task**: [Task 57: Unit Tests](task-57-unit-tests.md)
