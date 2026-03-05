# Task 46: Unit Tests

**Milestone**: [M13 - Memory Ratings REST](../../milestones/milestone-13-memory-ratings-rest.md)
**Estimated Time**: 1-2 hours
**Dependencies**: [Task 44](task-44-rating-controller-endpoints.md), [Task 45](task-45-by-rating-sort-endpoint.md)
**Status**: Not Started

---

## Objective

Add unit tests for the rating endpoints and byRating sort, following the colocated `*.spec.ts` pattern.

---

## Steps

### 1. Rating Endpoint Tests

Add to `src/memories/memories.controller.spec.ts`:

**PUT /memories/:id/rating**:
- rate with valid rating (1-5) returns 200 with RatingResponse
- rate with invalid rating (0) returns 400
- rate with invalid rating (6) returns 400
- rate with decimal (3.5) returns 400
- rate calls RatingService.rate() with correct args

**DELETE /memories/:id/rating**:
- retract returns 204
- retract calls RatingService.retract() with correct args

**GET /memories/:id/rating**:
- returns rating when exists
- throws NotFoundException when no rating

### 2. byRating Sort Tests

Add to `src/memories/memories.controller.spec.ts`:

- byRating calls MemoryService.byRating() with correct args
- byRating passes direction, limit, offset, filters
- byRating defaults direction to desc

### 3. DTO Validation Tests

Test RateMemoryDto validation:
- accepts integers 1-5
- rejects 0, 6, -1, 1.5, "abc"

Test RatingModeDto validation:
- accepts valid direction, limit, offset
- rejects invalid direction values

---

## Verification

- [ ] All new rating tests pass
- [ ] All existing tests still pass
- [ ] Coverage on rating endpoints is adequate
- [ ] Mock setup follows existing patterns in the spec file

---

**Related**: [Task 44](task-44-rating-controller-endpoints.md), [Task 45](task-45-by-rating-sort-endpoint.md)
