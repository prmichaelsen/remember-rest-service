# Task 62: Create Scheduler Module & Controller

**Milestone**: [M18 - Follow-Up Scheduler Endpoint](../../milestones/milestone-18-follow-up-scheduler-endpoint.md)
**Design Reference**: [Follow-Up Notification Scheduling](/home/prmichaelsen/.acp/projects/agentbase.me/agent/design/local.follow-up-notification-scheduling.md)
**Estimated Time**: 1 hour
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create a NestJS `SchedulerModule` with a controller that exposes `POST /api/internal/follow-ups/scan`. This endpoint calls remember-core's `scanAndNotifyFollowUps()` with injected deps.

---

## Steps

### 1. Create `src/scheduler/scheduler.controller.ts`

- Route: `POST /api/internal/follow-ups/scan`
- Mark `@Public()` (Cloud Scheduler uses OIDC, not JWT)
- Inject: `WEAVIATE_CLIENT`, `EVENT_BUS`, `LOGGER`
- Build `collectionEnumerator` using `getNextMemoryCollection()` from remember-core
- Call `scanAndNotifyFollowUps({ weaviateClient, eventBus, logger, collectionEnumerator })`
- Return the `ScanResult` (`{ scanned, notified, failed }`)

### 2. Create `src/scheduler/scheduler.module.ts`

- Import nothing extra (deps come from CoreModule global exports)
- Register `SchedulerController`

### 3. Create `src/scheduler/index.ts`

- Barrel export for `SchedulerModule`

### 4. Register in `app.module.ts`

- Import `SchedulerModule`

### 5. Verify build

- `npm run build` succeeds

---

## Verification

- [ ] `POST /api/internal/follow-ups/scan` endpoint exists
- [ ] Endpoint is `@Public()` (no JWT)
- [ ] `scanAndNotifyFollowUps()` called with correct deps
- [ ] `collectionEnumerator` built from `getNextMemoryCollection()`
- [ ] Returns `{ scanned, notified, failed }`
- [ ] Build succeeds
