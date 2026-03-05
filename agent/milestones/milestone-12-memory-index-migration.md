# Milestone 12: Memory Index Migration

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: remember-core M18 (Memory Index Lookup Table) — complete
**Prerequisite**: Run `npm run migrate:backfill-memory-index` in remember-core after deployment

---

## Goal

Migrate remember-rest-service to use remember-core's new `MemoryIndexService` and `MemoryService.resolveById()`, replacing the deprecated `MemoryResolutionService`. Wire index writes into all MemoryService constructors so new memories are automatically indexed.

---

## Context

remember-core M18 added:
- `MemoryIndexService` — Firestore UUID→collection lookup table
- `MemoryService.resolveById()` — O(1) cross-collection resolution via index
- `MemoryResolutionService` deleted from remember-core

The rest service currently:
1. Uses `MemoryResolutionService` in `AppMemoriesController` for cross-collection getById
2. Constructs `new MemoryService(collection, userId, logger)` in 4 controllers without the `memoryIndex` option — so new memories are not indexed

---

## Deliverables

1. NestJS provider for `MemoryIndexService` (singleton)
2. `AppMemoriesController` migrated from `MemoryResolutionService` to `MemoryService.resolveById()`
3. All `new MemoryService(...)` calls pass `{ memoryIndex, weaviateClient }` options
4. remember-core bumped to v0.27.5+
5. All existing tests updated, all passing

---

## Success Criteria

- [ ] No imports of `MemoryResolutionService` anywhere in codebase
- [ ] `MemoryIndexService` wired as NestJS provider
- [ ] All MemoryService constructors pass `memoryIndex` option
- [ ] `AppMemoriesController` uses `resolveById()` for cross-collection lookups
- [ ] All unit tests pass
- [ ] Build passes
- [ ] E2E tests pass after deployment

---

## Tasks

- [Task 39: Wire MemoryIndexService provider and update MemoryService constructors](../tasks/milestone-12-memory-index-migration/task-39-wire-memory-index-provider.md)
- [Task 40: Replace MemoryResolutionService with resolveById](../tasks/milestone-12-memory-index-migration/task-40-replace-memory-resolution-service.md)
