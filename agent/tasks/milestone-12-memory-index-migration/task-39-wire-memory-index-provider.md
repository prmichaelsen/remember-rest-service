# Task 39: Wire MemoryIndexService Provider and Update MemoryService Constructors

**Milestone**: [M12 - Memory Index Migration](../../milestones/milestone-12-memory-index-migration.md)
**Estimated Time**: 2-3 hours
**Dependencies**: remember-core v0.27.5+ (M18 complete)
**Status**: Not Started

---

## Objective

Create a NestJS provider for `MemoryIndexService` and update all `new MemoryService(...)` calls to pass `{ memoryIndex, weaviateClient }` options so new memories are automatically indexed in Firestore.

---

## Context

remember-core's `MemoryService` now accepts optional `{ memoryIndex, weaviateClient }` in its constructor. When `memoryIndex` is provided, `create()` automatically writes a Firestore index entry mapping the memory UUID to its Weaviate collection. Without it, creates still work but memories are not indexed (breaking `resolveById`).

---

## Steps

### 1. Bump remember-core

Update `package.json` to `@prmichaelsen/remember-core: ^0.27.5`.

### 2. Create MemoryIndexService provider

Add to `src/core/core.providers.ts` (or a new file):

```typescript
export const MEMORY_INDEX = Symbol('MEMORY_INDEX');

// Provider factory:
{
  provide: MEMORY_INDEX,
  useFactory: (logger: Logger) => new MemoryIndexService(logger),
  inject: [LOGGER],
}
```

Register in `CoreModule` providers and exports.

### 3. Update MemoryService construction in all controllers

Files to update:
- `src/memories/memories.controller.ts` — `new MemoryService(collection, userId, logger, { memoryIndex, weaviateClient })`
- `src/app/profiles/profiles.controller.ts` — same
- `src/app/relationships/app-relationships.controller.ts` — same
- `src/app/trust/ghost.controller.ts` — same

Each controller needs to:
- Inject `MEMORY_INDEX` and `WEAVIATE_CLIENT`
- Pass `{ memoryIndex, weaviateClient }` as 4th constructor arg

### 4. Update unit tests

Update mock setup in each controller's spec file:
- Add `MEMORY_INDEX` mock provider to test module
- Verify `MemoryService` is constructed with the options object

---

## Verification

- [ ] `MemoryIndexService` provider registered in CoreModule
- [ ] All 4 controllers inject and pass `memoryIndex` + `weaviateClient`
- [ ] All unit tests pass
- [ ] Build passes (`npm run build`)

---

## Expected Output

**Files Modified**:
- `package.json` — bump remember-core
- `src/core/core.providers.ts` — add MEMORY_INDEX provider
- `src/core/core.module.ts` — register provider
- `src/memories/memories.controller.ts` — inject + pass options
- `src/app/profiles/profiles.controller.ts` — inject + pass options
- `src/app/relationships/app-relationships.controller.ts` — inject + pass options
- `src/app/trust/ghost.controller.ts` — inject + pass options
- Corresponding `.spec.ts` files — update mocks

---

**Next Task**: [Task 40: Replace MemoryResolutionService with resolveById](task-40-replace-memory-resolution-service.md)
