# Milestone 11: Job Tracking REST

**Goal**: Implement async job tracking endpoints so import (and future REM) operations run as background jobs with status polling.
**Duration**: 1 week
**Dependencies**: [M9 - Import Endpoint](milestone-9-import-endpoint.md)
**Status**: Not Started

---

## Overview

remember-core v0.27.1 introduced a full job tracking system: `JobService` (Firestore CRUD), `ImportJobWorker` (chunked import with step tracking, cancellation, partial failure), and OpenAPI schemas for `Job`, `JobStep`, `JobError`, and job endpoints. The REST service currently runs imports synchronously. This milestone migrates to an async model: import returns `202 Accepted` with a `job_id`, and callers poll `GET /jobs/:id` for status.

This lays the groundwork for future async operations (REM cycles, bulk exports) to use the same job infrastructure.

---

## Deliverables

### 1. Core Dependency Bump
- remember-core bumped to v0.27.1
- ImportService @ts-ignore removed (now in barrel export)

### 2. Jobs Module
- `JobsModule` with `JobService` provider
- Registered in `AppModule`

### 3. Jobs Controller
- `GET /api/svc/v1/jobs/:id` — return job status
- `POST /api/svc/v1/jobs/:id/cancel` — cancel a running job

### 4. Async Import
- `POST /api/svc/v1/memories/import` returns 202 with `{ job_id }` + `Location` header
- Creates job via `JobService.create()`, dispatches `ImportJobWorker.execute()` in background
- Worker runs after response is sent (fire-and-forget with `setImmediate` or similar)

### 5. Cleanup Endpoint
- `POST /api/svc/v1/jobs/cleanup` (admin/cron) — calls `JobService.cleanupExpired()`
- Protected by service-token auth

### 6. Tests
- Unit tests for JobsController, JobsModule providers
- Unit tests for async import dispatch
- Unit tests for cleanup endpoint

---

## Success Criteria

- [ ] `POST /memories/import` returns 202 with `{ job_id }`
- [ ] `GET /jobs/:id` returns full job status with steps and progress
- [ ] `POST /jobs/:id/cancel` cancels a running job
- [ ] `POST /jobs/cleanup` removes expired jobs
- [ ] All existing tests pass (no regression)
- [ ] New unit tests cover all new endpoints
- [ ] TypeScript compiles without errors

---

## Key Files to Create

```
src/
├── jobs/
│   ├── jobs.module.ts
│   ├── jobs.controller.ts
│   ├── jobs.controller.spec.ts
│   └── jobs.dto.ts
```

## Key Files to Modify

```
src/
├── memories/
│   ├── memories.controller.ts      # import → async 202
│   └── memories.controller.spec.ts # update import tests
├── app.module.ts                    # register JobsModule
└── package.json                     # bump remember-core
```

---

## Tasks

1. [Task 34: Bump remember-core to v0.27.1](../tasks/milestone-11-job-tracking-rest/task-34-bump-remember-core.md) — Update dependency, remove @ts-ignore
2. [Task 35: Create JobsModule](../tasks/milestone-11-job-tracking-rest/task-35-create-jobs-module.md) — JobService provider, module registration
3. [Task 36: Create JobsController](../tasks/milestone-11-job-tracking-rest/task-36-create-jobs-controller.md) — GET /jobs/:id, POST /jobs/:id/cancel, POST /jobs/cleanup
4. [Task 37: Migrate import to async](../tasks/milestone-11-job-tracking-rest/task-37-async-import.md) — 202 response, background ImportJobWorker dispatch
5. [Task 38: Integration tests](../tasks/milestone-11-job-tracking-rest/task-38-integration-tests.md) — End-to-end job lifecycle test

---

## Testing Requirements

- [ ] Unit tests for JobsController (get, cancel, cleanup)
- [ ] Unit tests for async import dispatch (job created, 202 returned, worker called)
- [ ] Existing import tests updated to expect 202
- [ ] No test regressions

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Import worker errors silently after 202 response | Medium | Medium | Job step tracking captures errors; callers poll for status |
| Long-running imports hit Cloud Run timeout | High | Low | ImportJobWorker has cancellation support; Cloud Run default 5min is sufficient for chunked imports |

---

**Next Milestone**: M12 (TBD — REM Job Worker REST, or production deployment)
**Blockers**: None (remember-core v0.27.1 is published)
**Notes**: M10 Task 32 (bump core) is superseded by Task 34 here — bump target updated from v0.26.1 to v0.27.1
