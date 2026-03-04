# Milestone 10: Memory Resolution Fallback

**Status**: Not Started
**Estimated Time**: 1-2 hours
**Dependencies**: remember-core v0.26.1 published

---

## Goal

Integrate `MemoryResolutionService` from remember-core into the memories controller so that `GET /api/svc/v1/memories/:id` gracefully falls back to the user's own collection when context params (author/space/group) point to the wrong collection.

## Deliverables

1. remember-core bumped to v0.26.1 (also resolves M9 ImportService barrel export blocker)
2. `getById` in `MemoriesController` uses `MemoryResolutionService.resolve()` instead of raw `fetchMemoryWithAllProperties`
3. Similar memories fetched from the resolved collection (not the originally requested one)
4. Unit tests updated/added
5. TypeScript builds cleanly

## Success Criteria

- `GET /memories/:id?author=wrong-user` returns the memory if it exists in the user's own collection
- `GET /memories/:id?space=wrong-space` returns the memory if it exists in the user's own collection
- `GET /memories/:id` with correct params still works (no regression)
- `GET /memories/:id` with invalid ID still returns 404
- All existing tests still pass
