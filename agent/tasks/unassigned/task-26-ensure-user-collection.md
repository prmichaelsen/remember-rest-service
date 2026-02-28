# Task 26: Add ensureUserCollection to Controllers

**Milestone**: Unassigned (bug fix)
**Estimated Time**: 1-2 hours
**Dependencies**: None
**Status**: Completed

---

## Objective

Call `ensureUserCollection(client, userId)` from `@prmichaelsen/remember-core/database/weaviate` in controller `getService()` methods so that Weaviate collections are automatically created on a user's first request. Currently, if the collection `Memory_users_{userId}` doesn't exist, all CRUD operations return 500.

---

## Context

- `MemoryService.create()` does NOT call `ensureCollections` automatically
- Controllers do `weaviateClient.collections.get(...)` which gets a reference but doesn't create the collection
- remember-core exports `ensureUserCollection(client: WeaviateClient, userId: string): Promise<boolean>` from `@prmichaelsen/remember-core/database/weaviate`
- This function creates the collection if it doesn't exist, returns true if created / false if already existed
- This is blocking live E2E tests (all CRUD operations 500 for new test users)

---

## Steps

### 1. Update controllers with ensureUserCollection

Add `await ensureUserCollection(this.weaviateClient, userId)` to `getService()` in:
- `src/memories/memories.controller.ts`
- `src/relationships/relationships.controller.ts`
- `src/spaces/spaces.controller.ts`
- `src/confirmations/confirmations.controller.ts`
- `src/trust/trust.controller.ts` (for check-access endpoint)

Make `getService()` async where needed.

### 2. Update unit tests

Update mocks to handle the new `ensureUserCollection` import.

### 3. Verify live E2E tests pass with real CRUD

Run `npm run test:live` and confirm memory creation succeeds (201 instead of 500).

---

## Verification

- [x] `npm test` — all 99 unit tests pass
- [x] `npm run test:e2e` — all 18 integration tests pass
- [ ] `npm run test:live` — memory creation returns 201 (needs redeploy)
- [ ] Live CRUD lifecycle works end-to-end (needs redeploy)

---

**Related**: [Task 9: Memory Controller](../milestone-3-api-controllers/task-9-memory-controller.md)
