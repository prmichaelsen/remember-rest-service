# Task 24: Memory & Relationship CRUD Live Tests

**Milestone**: [M6 - Live E2E Testing](../../milestones/milestone-6-live-e2e-testing.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 22, Task 23
**Status**: Not Started

---

## Objective

Create live tests exercising the full CRUD lifecycle for memories and relationships against the deployed e1 service.

---

## Steps

### 1. Create `test/live/suites/03-memories.live.ts`

Full lifecycle:
1. POST /api/svc/v1/memories — create memory, capture memory_id
2. POST /api/svc/v1/memories/search — search by content
3. POST /api/svc/v1/memories/similar — find similar by text
4. POST /api/svc/v1/memories/query — semantic query
5. PATCH /api/svc/v1/memories/:id — update content
6. DELETE /api/svc/v1/memories/:id — soft delete
7. afterAll cleanup

Handle gracefully if Weaviate collection doesn't exist (log warning, skip dependent tests).

### 2. Create `test/live/suites/04-relationships.live.ts`

Full lifecycle:
1. Create 2 memories as prerequisites
2. POST /api/svc/v1/relationships — create relationship linking memories
3. POST /api/svc/v1/relationships/search — search for relationship
4. PATCH /api/svc/v1/relationships/:id — update relationship
5. DELETE /api/svc/v1/relationships/:id — delete relationship
6. afterAll cleanup (delete relationship + both memories)

---

## Verification

- [ ] Memory CRUD lifecycle completes (create → search → update → delete)
- [ ] Relationship CRUD lifecycle completes
- [ ] Test data cleaned up after each suite
- [ ] Graceful handling if Weaviate collection missing

---

**Next Task**: [Task 25: Preferences, Trust & Spaces Live Tests](task-25-preferences-trust-spaces-live-tests.md)
