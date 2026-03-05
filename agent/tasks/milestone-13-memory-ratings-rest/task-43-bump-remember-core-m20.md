# Task 43: Bump remember-core for M20

**Milestone**: [M13 - Memory Ratings REST](../../milestones/milestone-13-memory-ratings-rest.md)
**Estimated Time**: 0.5 hours
**Dependencies**: remember-core M20 complete
**Status**: Not Started

---

## Objective

Update `@prmichaelsen/remember-core` dependency to the version that includes M20 (Memory Ratings System): RatingService, byRating sort mode, OpenAPI spec updates, and regenerated SVC client types.

---

## Steps

### 1. Update Dependency

```bash
npm install @prmichaelsen/remember-core@latest
```

### 2. Verify New Exports

Confirm these are available from remember-core:
- `RatingService` from `@prmichaelsen/remember-core/services`
- `RateMemoryInput`, `RatingResult`, `MemoryRating`, `RatingModeRequest`, `RatingModeResult` from types
- `computeBayesianScore`, `computeRatingAvg`, `isValidRating` from types
- `byRating()` method on `MemoryService`

### 3. Verify Generated Types

Check that `types.generated.ts` in remember-core includes:
- `RateMemoryRequest` schema
- `RatingResponse` schema
- `UserRatingResponse` schema

### 4. Build Check

```bash
npx tsc --noEmit
npm test
```

---

## Verification

- [ ] remember-core updated to M20+ version
- [ ] RatingService importable
- [ ] byRating method available on MemoryService
- [ ] Generated types include rating schemas
- [ ] `tsc --noEmit` clean
- [ ] Existing tests still pass

---

**Next Task**: [Task 44: Rating Controller Endpoints](task-44-rating-controller-endpoints.md)
