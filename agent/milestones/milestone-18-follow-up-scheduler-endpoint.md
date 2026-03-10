# Milestone 18: Follow-Up Scheduler Endpoint

**Status**: Not Started
**Estimated**: 0.5 days
**Dependencies**: remember-core >= 0.57.0 (M41 complete)

---

## Overview

Wire remember-core's `FollowUpSchedulerService` into a Cloud Scheduler-callable REST endpoint. GCP Cloud Scheduler hits `POST /api/internal/follow-ups/scan` every minute to scan for due follow-up notifications and emit webhook events.

## Deliverables

1. **SchedulerModule** — NestJS module with `SchedulerController`
2. **POST /api/internal/follow-ups/scan** — Public endpoint (no JWT, protected by Cloud Scheduler OIDC) that calls `scanAndNotifyFollowUps()`
3. **Bump remember-core** to >= 0.57.0
4. **Unit tests** for the controller

## Tasks

- Task 62: Create Scheduler Module & Controller
- Task 63: Unit Tests

## Success Criteria

- [ ] `POST /api/internal/follow-ups/scan` returns `{ scanned, notified, failed }`
- [ ] Endpoint is public (no JWT required — Cloud Scheduler uses OIDC)
- [ ] Dependencies injected: WeaviateClient, EventBus, Logger, collectionEnumerator
- [ ] Unit tests pass
- [ ] Build succeeds
