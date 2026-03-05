# Task 45: byRating Sort Endpoint

**Milestone**: [M13 - Memory Ratings REST](../../milestones/milestone-13-memory-ratings-rest.md)
**Estimated Time**: 1 hour
**Dependencies**: [Task 43](task-43-bump-remember-core-m20.md)
**Status**: Not Started

---

## Objective

Add `POST /api/svc/v1/memories/by-rating` endpoint, following the same pattern as existing `by-time` and `by-density` sort endpoints.

---

## Steps

### 1. Create RatingModeDto

Add to `src/memories/memories.dto.ts`:

```typescript
export class RatingModeDto {
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  filters?: Record<string, unknown>;
}
```

Same pattern as `TimeModeDto` and `DensityModeDto`.

### 2. Add Controller Method

```typescript
@Post('by-rating')
async byRating(@User() userId: string, @Body() dto: RatingModeDto) {
  const service = await this.getService(userId);
  return service.byRating(dto as RatingModeRequest);
}
```

### 3. Import RatingModeRequest Type

Add `RatingModeRequest` to the remember-core imports in `memories.controller.ts`.

---

## Verification

- [ ] `POST /memories/by-rating` returns memories sorted by Bayesian score
- [ ] Default direction is `desc` (highest rated first)
- [ ] Pagination (limit, offset) works
- [ ] Filters applied correctly
- [ ] Unrated memories (Bayesian = 3.0) sort in middle
- [ ] `tsc --noEmit` clean

---

**Next Task**: [Task 46: Unit Tests](task-46-unit-tests.md)
