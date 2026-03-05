# Milestone 13: Memory Ratings REST Endpoints

**Goal**: Expose remember-core's RatingService and byRating sort mode over REST API
**Duration**: 1 week
**Dependencies**: remember-core M20 (Memory Ratings System)
**Status**: Not Started

---

## Overview

Add REST endpoints for the 1-5 star memory rating system. Users can rate, update, retract, and retrieve their rating for any memory they have access to. A new `byRating` sort endpoint orders memories by Bayesian average score. Aggregate rating data (`rating_avg`, `rating_count`) is included on Memory objects in all existing responses automatically (handled by remember-core's MemoryService).

**Design Doc**: remember-core `agent/design/local.memory-ratings.md`
**Clarifications**: remember-core clarification-8, clarification-9, clarification-10

---

## Deliverables

### 1. RatingService Provider
- NestJS provider wrapping remember-core's `RatingService`
- Instantiated per-request with `weaviateClient`, Firestore, `memoryIndex`, `logger`

### 2. Rating Endpoints (on MemoriesController)
- `PUT /api/svc/v1/memories/:id/rating` — submit or update (body: `{ rating: 1-5 }`)
- `DELETE /api/svc/v1/memories/:id/rating` — retract
- `GET /api/svc/v1/memories/:id/rating` — get current user's rating

### 3. byRating Sort Endpoint
- `POST /api/svc/v1/memories/by-rating` — sort by Bayesian score

### 4. DTOs
- `RateMemoryDto` — `@IsInt()`, `@Min(1)`, `@Max(5)` (mirrors generated `RateMemoryRequest`)
- `RatingModeDto` — direction, limit, offset, filters (same pattern as `TimeModeDto`)

### 5. Unit Tests
- Rating CRUD: rate, update, retract, get
- Validation: invalid rating values, self-rate rejection
- byRating sort: mock Weaviate sort by `rating_bayesian`

---

## Success Criteria

- [ ] PUT rating returns 200 with `RatingResponse`
- [ ] DELETE rating returns 204
- [ ] GET rating returns 200 or 404
- [ ] Self-rating returns 403
- [ ] Invalid rating (0, 6, 1.5) returns 400
- [ ] byRating sort returns memories ordered by Bayesian score
- [ ] All new unit tests pass
- [ ] Existing 150+ tests unaffected
- [ ] `tsc --noEmit` clean

---

## Tasks

1. [Task 43: Bump remember-core for M20](../tasks/milestone-13-memory-ratings-rest/task-43-bump-remember-core-m20.md) — Update dependency once ratings ship
2. [Task 44: Rating Controller Endpoints](../tasks/milestone-13-memory-ratings-rest/task-44-rating-controller-endpoints.md) — PUT/DELETE/GET + DTOs + provider
3. [Task 45: byRating Sort Endpoint](../tasks/milestone-13-memory-ratings-rest/task-45-by-rating-sort-endpoint.md) — POST /memories/by-rating
4. [Task 46: Unit Tests](../tasks/milestone-13-memory-ratings-rest/task-46-unit-tests.md) — Rating + byRating test coverage

---

## Key Design Notes

- **Generated types**: Once remember-core's OpenAPI spec is updated (M20 Task 108), `types.generated.ts` will include `RateMemoryRequest`, `RatingResponse`, `UserRatingResponse`. Our DTOs mirror these but add class-validator decorators for NestJS validation pipe.
- **No new controller**: Rating endpoints are sub-resources of `/memories/:id`, so they live on `MemoriesController`.
- **RatingService instantiation**: Per-request, same pattern as MemoryService. Needs `weaviateClient`, Firestore prefix, `memoryIndex`, `logger`.
- **Aggregate fields**: `rating_avg` and `rating_count` are automatically included on Memory objects by remember-core's MemoryService — no REST-side work needed.

---

## Blockers

- remember-core M20 must complete (RatingService, byRating sort, OpenAPI spec + type generation)

---

**Next Milestone**: TBD
**Notes**: Additive changes only — no breaking changes to existing endpoints
