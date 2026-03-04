# Task 33: Use MemoryResolutionService in getById

**Milestone**: [M10 - Memory Resolution Fallback](../../milestones/milestone-10-memory-resolution.md)
**Estimated Time**: 1 hour
**Dependencies**: [Task 32](task-32-bump-remember-core.md)
**Status**: Not Started

---

## Objective

Replace the raw `fetchMemoryWithAllProperties` call in `MemoriesController.getById` with `MemoryResolutionService.resolve()` so that memory lookups gracefully fall back to the user's own collection when context params are wrong.

---

## Context

Currently `getById` does a single collection lookup based on context params. If the params point to the wrong collection, it returns 404 even though the memory exists in the user's own collection. `MemoryResolutionService` (added in remember-core v0.26.1) handles this by trying the requested collection first, then falling back to the user's own collection.

The `similar_memories` lookup must also use the resolved collection (where the memory was actually found), not the originally requested collection.

---

## Steps

### 1. Update imports

Add `MemoryResolutionService` to the imports from `@prmichaelsen/remember-core/services`. The `fetchMemoryWithAllProperties` import can be removed if no other method uses it.

### 2. Update getById method

**Before**:
```typescript
@Get(':id')
async getById(...) {
  const source = { author, space, group };
  const collectionName = this.resolveCollectionName(userId, source);
  const collection = this.weaviateClient.collections.get(collectionName);
  const existing = await fetchMemoryWithAllProperties(collection, id);
  if (!existing?.properties) {
    throw new NotFoundException(`Memory not found: ${id}`);
  }
  const result = { memory: { id: existing.uuid, ...existing.properties } };
  // similar_memories uses getService(userId, source) — original source
}
```

**After**:
```typescript
@Get(':id')
async getById(...) {
  const source = { author, space, group };
  const resolver = new MemoryResolutionService(this.weaviateClient, userId, this.logger);
  const resolved = await resolver.resolve(id, source);
  if (!resolved) {
    throw new NotFoundException(`Memory not found: ${id}`);
  }
  const result: Record<string, unknown> = { memory: resolved.memory };

  if (include === 'similar' || include === 'both') {
    // Use resolved.collectionName for similar lookup
    const collection = this.weaviateClient.collections.get(resolved.collectionName);
    const service = new MemoryService(collection, userId, this.logger);
    const similar = await service.findSimilar({
      memory_id: id,
      limit: 5,
      min_similarity: 0.6,
    });
    result.similar_memories = similar.similar_memories ?? [];
  }
  return result;
}
```

### 3. Update unit tests

Update `memories.controller.spec.ts`:
- Existing `getById` tests should still pass (happy path unchanged)
- Add test: `getById` with wrong author param still returns memory from user collection
- Add test: `getById` with wrong space param still returns memory from user collection

### 4. Verify

```bash
npm run build
npm run test
```

---

## Verification

- [ ] `getById` uses `MemoryResolutionService.resolve()` instead of raw `fetchMemoryWithAllProperties`
- [ ] `similar_memories` fetched from `resolved.collectionName`
- [ ] `fetchMemoryWithAllProperties` import removed (if unused by other methods)
- [ ] New unit tests for fallback scenarios
- [ ] All existing tests pass
- [ ] TypeScript builds cleanly

---

## Notes

- `resolveCollectionName` private method can stay in the controller — it's still used by `getService()` for other endpoints
- `MemoryResolutionService` is constructed per-request (lightweight, no setup cost)
- No changes to SvcClient or agentbase.me — transparent to clients
