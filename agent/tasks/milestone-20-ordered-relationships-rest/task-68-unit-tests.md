# Task 68: Unit Tests

**Status**: not_started
**Milestone**: M20 — Ordered Relationships REST Endpoints
**Created**: 2026-03-13
**Estimated Hours**: 1
**Dependencies**: Task 66, Task 67

---

## Objective

Add unit tests for the reorder endpoint (svc-tier) and ordered content response (app-tier).

## Steps

### 1. Svc-tier tests in `relationships.controller.spec.ts`

Add `reorder` to `mockRelationshipService`. New tests:

- **reorder with move_to_index**: calls `service.reorder()` with correct `{ relationship_id, operation: { type: 'move_to_index', memory_id, index }, version }`
- **reorder with swap**: calls with `{ type: 'swap', memory_id_a, memory_id_b }`
- **reorder with set_order**: calls with `{ type: 'set_order', ordered_memory_ids }`
- **reorder with move_before**: calls with `{ type: 'move_before', memory_id, before }`
- **reorder with move_after**: calls with `{ type: 'move_after', memory_id, after }`
- **reorder returns result**: verifies `{ relationship_id, member_order, version, updated_at }` passthrough

### 2. App-tier tests in `app-relationships.controller.spec.ts`

New tests:

- **returns memories sorted by position**: relationship has `member_order: { 'mem-1': 2, 'mem-2': 0, 'mem-3': 1 }`, verify response order is mem-2, mem-3, mem-1
- **includes position field on each memory**: verify `result.memories[0].position` exists and matches `member_order`
- **falls back to alphabetical when no member_order**: existing behavior preserved when `member_order` is absent
- **pagination respects position order**: offset/limit applied after position sort

### 3. Existing test compatibility

- Existing tests should pass unchanged (alphabetical sort is fallback)
- Run full suite to verify no regressions

## Verification

- [ ] 6+ new svc-tier tests (one per operation type + result shape)
- [ ] 4+ new app-tier tests (position sort, position field, fallback, pagination)
- [ ] All existing tests still pass
- [ ] `npm test` clean (aside from 2 pre-existing failures in core.providers.spec.ts)
