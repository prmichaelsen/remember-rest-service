# Task 38: Integration Tests

**Milestone**: [M11 - Job Tracking REST](../../milestones/milestone-11-job-tracking-rest.md)
**Estimated Time**: 1-2 hours
**Dependencies**: [Task 37](task-37-async-import.md)
**Status**: Not Started

---

## Objective

Write integration tests (e2e) that verify the full job lifecycle through the NestJS HTTP layer: import → poll → complete, import → cancel, and cleanup.

---

## Context

The REST service uses NestJS testing utilities (`@nestjs/testing`) for e2e tests. These test the full HTTP request/response cycle with mocked Firestore and Weaviate backends.

---

## Steps

### 1. Create e2e test file
Create `src/jobs/jobs.e2e.spec.ts` (or `jobs.e2e.ts` per project convention):

### 2. Test scenarios

**Scenario 1: Import → Poll → Completed**
1. `POST /memories/import` → expect 202, get `job_id`
2. `GET /jobs/:job_id` → expect job with status 'pending' or 'running'
3. Wait for worker to complete (small timeout)
4. `GET /jobs/:job_id` → expect 'completed', progress 100

**Scenario 2: Import → Cancel**
1. `POST /memories/import` → expect 202, get `job_id`
2. `POST /jobs/:job_id/cancel` → expect success
3. `GET /jobs/:job_id` → expect 'cancelled'

**Scenario 3: Get non-existent job**
1. `GET /jobs/nonexistent` → expect 404

**Scenario 4: Cleanup**
1. Create and complete a job (set completed_at in past)
2. `POST /jobs/cleanup` → expect `{ deleted: 1 }`

### 3. Mock configuration
- Mock Firestore (in-memory map, same pattern as remember-core integration tests)
- Mock Weaviate client (already done in existing e2e tests)
- Mock HaikuClient

---

## Verification

- [ ] All 4 e2e test scenarios pass
- [ ] Tests properly clean up after themselves
- [ ] No flaky timing issues (use appropriate waits/polling)
- [ ] All existing tests still pass
- [ ] Build succeeds

---

**Notes**: If the e2e test for async import is flaky due to timing, it's acceptable to mock the worker and verify it was called, rather than waiting for actual execution.
