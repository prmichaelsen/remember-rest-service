# Task 40: Replace MemoryResolutionService with resolveById

**Milestone**: [M12 - Memory Index Migration](../../milestones/milestone-12-memory-index-migration.md)
**Estimated Time**: 1-2 hours
**Dependencies**: [Task 39: Wire MemoryIndexService provider](task-39-wire-memory-index-provider.md)
**Status**: Not Started

---

## Objective

Replace `MemoryResolutionService` usage in `AppMemoriesController` with `MemoryService.resolveById()`. This is the only consumer of the now-deleted `MemoryResolutionService` in the rest service.

---

## Context

`AppMemoriesController` currently:
1. Creates a `MemoryResolutionService` per request via `getResolutionService(userId)`
2. Calls `resolver.resolve(memoryId)` for the primary memory and each related memory preview
3. Returns `{ memory, collectionName }` shape

`MemoryService.resolveById()` returns the same `{ memory, collectionName }` shape (as `ResolveByIdResult`), using the Firestore index for O(1) lookup instead of the 2-try fallback.

---

## Steps

### 1. Update AppMemoriesController

Replace:
```typescript
import { MemoryResolutionService } from '@prmichaelsen/remember-core/services';

private getResolutionService(userId: string): MemoryResolutionService {
  return new MemoryResolutionService(this.weaviateClient, userId, this.logger);
}
```

With a `getMemoryService()` that constructs `MemoryService` with `{ memoryIndex, weaviateClient }`:
```typescript
private getMemoryService(userId: string): MemoryService {
  const collection = this.weaviateClient.collections.get(`Memory_users_${userId}`);
  return new MemoryService(collection, userId, this.logger, {
    memoryIndex: this.memoryIndex,
    weaviateClient: this.weaviateClient,
  });
}
```

### 2. Replace resolve() calls with resolveById()

In `getMemory()`:
```typescript
// Before:
const resolved = await resolver.resolve(memoryId);

// After:
const resolved = await memoryService.resolveById(memoryId);
if (!resolved.memory) throw new NotFoundException(...);
```

Same for the related memory preview loop — `resolver.resolve(id)` → `memoryService.resolveById(id)`.

Note: `resolveById` returns `{ memory: null, collectionName: null }` instead of `null`, so update the null check from `if (!resolved)` to `if (!resolved.memory)`.

### 3. Remove MemoryResolutionService import

Delete the import. Verify no other file imports it.

### 4. Update spec file

In `app-memories.controller.spec.ts`:
- Remove `MemoryResolutionService` mock
- Mock `MemoryService` with `resolveById` method instead
- Update test assertions for the new null shape (`{ memory: null }` vs `null`)

### 5. Verify no remaining references

```bash
grep -r "MemoryResolutionService" src/
```

Should return zero results.

---

## Verification

- [ ] `AppMemoriesController` uses `MemoryService.resolveById()` instead of `MemoryResolutionService.resolve()`
- [ ] No imports of `MemoryResolutionService` in codebase
- [ ] All unit tests pass
- [ ] Build passes
- [ ] E2E tests pass (after deployment)

---

## Expected Output

**Files Modified**:
- `src/app/memories/app-memories.controller.ts` — replace resolution service with resolveById
- `src/app/memories/app-memories.controller.spec.ts` — update mocks and assertions

---

**Related Design Docs**: [remember-core: agent/design/local.memory-index-lookup.md]
