# Milestone 10: Memory Resolution Fallback

**Status**: Not Started
**Estimated Time**: 1-2 hours
**Dependencies**: remember-core v0.27.1 published

---

## Goal

Implement `GET /api/app/v1/memories/:id` — an app-tier endpoint that uses `MemoryResolutionService` from remember-core for cross-collection fallback, with optional relationship compound response.

This matches the `AppClient.memories.get()` SDK method (remember-core v0.27.0) that agentbase.me already calls.

## Architecture

- **App tier** (`/api/app/v1/memories/:id`) — compound endpoint with resolution fallback + relationships. New in this milestone.
- **Svc tier** (`/api/svc/v1/memories/:id`) — raw single-collection lookup. Unchanged.

## Deliverables

1. remember-core bumped to latest (v0.27.1+)
2. New `AppMemoriesController` at `/api/app/v1/memories/:id`
3. Uses `MemoryResolutionService.resolve()` for cross-collection fallback
4. Optionally includes relationships when `includeRelationships=true`
5. Registered in `AppTierModule`
6. Unit tests

## Success Criteria

- `GET /api/app/v1/memories/:id` returns the memory from user's collection
- `GET /api/app/v1/memories/:id?includeRelationships=true` returns memory + relationships
- Memory not found returns 404
- Svc-tier endpoint unchanged (no regression)
- All existing tests pass
