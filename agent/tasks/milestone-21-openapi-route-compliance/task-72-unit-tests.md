# Task 72: Unit Tests for OpenAPI Route Compliance

## Objective
Add unit tests for all endpoints created in tasks 69-71.

## Test Coverage

### Svc-Tier (Task 69)
- Engagement counters: 3 tests (click 204, share 204, comment-count 204) + 3 error tests (404)
- spaces/by-recommendation: 2 tests (success, delegates to service)

### App-Tier Memories (Task 70)
- create, update, delete: 3 tests each (success case)
- search, similar, query: 3 tests (success, delegates to service)
- with-relationships: 2 tests (with relationships, with similar)
- Relationship CRUD: 4 tests (create, update, delete, search)

### App-Tier Spaces/Trust/Preferences (Task 71)
- Spaces (publish, retract, revise, moderate, search, query): 6 tests
- Trust (ghost-config get/patch, set/remove/block/unblock/check): 7 tests
- Preferences (get, patch): 2 tests

## Steps

### 1. Add svc-tier tests
- Extend `src/memories/memories.controller.spec.ts` for engagement counters
- Extend `src/spaces/spaces.controller.spec.ts` for by-recommendation

### 2. Add app-tier memory tests
- Extend `src/app/memories/app-memories.controller.spec.ts`
- Add with-relationships tests

### 3. Add app-tier relationship tests
- Extend `src/app/relationships/app-relationships.controller.spec.ts`

### 4. Add app-tier spaces tests
- Extend `src/app/spaces/app-spaces.controller.spec.ts`

### 5. Add app-tier trust tests
- Extend or create `src/app/trust/ghost.controller.spec.ts` → `app-trust.controller.spec.ts`

### 6. Add app-tier preferences tests
- Create `src/app/preferences/app-preferences.controller.spec.ts`

## Verification
- [ ] All new tests pass
- [ ] No regressions in existing tests
- [ ] ~30-35 new tests added

## Dependencies
- Tasks 69, 70, 71 complete

## Estimated Hours
2-3
