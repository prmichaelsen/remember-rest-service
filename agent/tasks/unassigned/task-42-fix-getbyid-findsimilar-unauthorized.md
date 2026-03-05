# Task 42: Fix getById findSimilar Unauthorized Error

## Status: Completed
## Milestone: Unassigned (bug fix)
## Estimated Hours: 0.5
## Actual Hours: 0.1
## Completed Date: 2026-03-05
## Dependencies: None

---

## Objective

Fix HTTP 500 errors on `GET /api/svc/v1/memories/:id?include=similar` caused by MemoryService.findSimilar() throwing "Unauthorized" when the endpoint is accessed via `@Public()` decorator.

## Context

Production logs showed all `GET /memories/:id?include=similar` requests returning 500 with:
```
Error: Unauthorized
    at MemoryService.findSimilar (memory.service.js:306:23)
    at MemoriesController.getById (memories.controller.js:75:29)
```

The `getById` endpoint is `@Public()` so `userId` can be null. When `include=similar` is requested, the controller created a MemoryService with `userId ?? 'anonymous'`. But `findSimilar()` in remember-core checks `memoryObj.properties.user_id !== this.userId` and throws "Unauthorized" since `'anonymous' !== '<actual-user-id>'`.

## Root Cause

`src/memories/memories.controller.ts` line 109: MemoryService was constructed with the request's userId (or 'anonymous' for unauthenticated) instead of the memory's actual owner. The ownership check in `findSimilar()` then rejected the request.

## Fix

Extract the memory's `user_id` from the already-fetched document (`existing.properties`) and use it as the MemoryService owner. This is safe because access control was already enforced at line 94 (unauthenticated users can only access public space memories).

### Files Modified
- `src/memories/memories.controller.ts` - Use `memoryOwner` from fetched memory properties instead of request userId

## Verification

- [x] Typecheck passes (`tsc --noEmit` — only pre-existing jobs.e2e.ts errors)
- [x] Fix uses already-fetched data (no extra DB call)
- [x] Access control still enforced (line 94 blocks unauthenticated access to non-public memories)
