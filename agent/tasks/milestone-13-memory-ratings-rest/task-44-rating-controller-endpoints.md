# Task 44: Rating Controller Endpoints

**Milestone**: [M13 - Memory Ratings REST](../../milestones/milestone-13-memory-ratings-rest.md)
**Estimated Time**: 2-3 hours
**Dependencies**: [Task 43](task-43-bump-remember-core-m20.md)
**Status**: Not Started

---

## Objective

Add PUT/DELETE/GET rating endpoints to MemoriesController and create the necessary DTOs. RatingService is instantiated per-request following the existing controller pattern.

---

## Context

Rating endpoints are sub-resources of `/memories/:id/rating` (singular — always the current user's single rating). RatingService from remember-core handles all business logic including self-rate rejection, aggregate updates, and Firestore storage.

**Design**: remember-core `agent/design/local.memory-ratings.md`

---

## Steps

### 1. Create RateMemoryDto

Add to `src/memories/memories.dto.ts`:

```typescript
export class RateMemoryDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
```

This mirrors the generated `RateMemoryRequest` from the OpenAPI spec but adds class-validator decorators for NestJS validation pipe.

### 2. Add RatingService Helper to MemoriesController

Add a private method to create a RatingService instance per-request:

```typescript
private getRatingService(): RatingService {
  return new RatingService({
    weaviateClient: this.weaviateClient,
    memoryIndexService: this.memoryIndex,
    logger: this.logger,
    // Firestore config as needed
  });
}
```

Note: Check RatingService constructor signature in remember-core — it may need `firestore` and `firestorePrefix` params. If Firestore is not yet a provider, add a FIRESTORE provider or pass config.

### 3. Implement PUT /memories/:id/rating

```typescript
@Put(':id/rating')
async rateMemory(
  @User() userId: string,
  @Param('id') id: string,
  @Body() dto: RateMemoryDto,
) {
  const service = this.getRatingService();
  return service.rate({ memoryId: id, userId, rating: dto.rating });
}
```

Returns 200 with `RatingResponse` (`{ previousRating, newRating, ratingCount, ratingAvg }`).

### 4. Implement DELETE /memories/:id/rating

```typescript
@Delete(':id/rating')
@HttpCode(204)
async retractRating(
  @User() userId: string,
  @Param('id') id: string,
) {
  const service = this.getRatingService();
  await service.retract(id, userId);
}
```

Returns 204 No Content.

### 5. Implement GET /memories/:id/rating

```typescript
@Get(':id/rating')
async getMyRating(
  @User() userId: string,
  @Param('id') id: string,
) {
  const service = this.getRatingService();
  const rating = await service.getUserRating(id, userId);
  if (!rating) {
    throw new NotFoundException('No rating found');
  }
  return rating;
}
```

Returns 200 with `{ rating, created_at, updated_at }` or 404.

### 6. Handle Route Ordering

Ensure `:id/rating` routes don't conflict with existing `:id` route. NestJS matches routes top-to-bottom, so the specific `/rating` sub-resource routes should be placed before or handled correctly alongside the generic `:id` GET.

---

## Verification

- [ ] `PUT /memories/:id/rating` with `{ rating: 3 }` returns 200
- [ ] `PUT /memories/:id/rating` with `{ rating: 0 }` returns 400
- [ ] `PUT /memories/:id/rating` with `{ rating: 6 }` returns 400
- [ ] `DELETE /memories/:id/rating` returns 204
- [ ] `GET /memories/:id/rating` returns 200 or 404
- [ ] Self-rating returns 403 (enforced by RatingService)
- [ ] RateMemoryDto validates correctly
- [ ] Route ordering does not break existing `:id` endpoint
- [ ] `tsc --noEmit` clean

---

**Next Task**: [Task 45: byRating Sort Endpoint](task-45-by-rating-sort-endpoint.md)
