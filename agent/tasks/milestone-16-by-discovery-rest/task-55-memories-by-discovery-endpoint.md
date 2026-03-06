# Task 55: Memories byDiscovery Endpoint

**Milestone**: [M16 - byDiscovery REST Endpoints](../../milestones/milestone-16-by-discovery-rest.md)
**Estimated Time**: 0.5 hours
**Dependencies**: [Task 54](task-54-bump-remember-core.md)
**Status**: Not Started

---

## Objective

Add `POST /api/svc/v1/memories/by-discovery` endpoint to MemoriesController, following the same pattern as `by-time`, `by-density`, and `by-rating`.

---

## Steps

### 1. Create DiscoveryModeDto

Add to `src/memories/memories.dto.ts`:

```typescript
export class DiscoveryModeDto {
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
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsEnum(['exclude', 'include', 'only'])
  deleted_filter?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GhostSearchContextDto)
  ghost_context?: GhostSearchContextDto;
}
```

Same shape as `DiscoveryModeRequest` from remember-core. No `direction` field — discovery always returns rated DESC interleaved with recent unrated.

### 2. Add Controller Method

In `src/memories/memories.controller.ts`:

```typescript
@Post('by-discovery')
async byDiscovery(@User() userId: string, @Body() dto: DiscoveryModeDto) {
  const service = await this.getService(userId);
  return service.byDiscovery(dto as DiscoveryModeRequest);
}
```

### 3. Add Import

Add `DiscoveryModeRequest` to the remember-core imports in `memories.controller.ts`.

---

## Verification

- [ ] `POST /memories/by-discovery` returns interleaved memories with `is_discovery` boolean
- [ ] Default limit/offset work correctly
- [ ] Filters, deleted_filter, ghost_context propagated
- [ ] `tsc --noEmit` clean

---

**Next Task**: [Task 56: Spaces byDiscovery Endpoint](task-56-spaces-by-discovery-endpoint.md)
