# Task 23: Smoke & Auth Live Tests

**Milestone**: [M6 - Live E2E Testing](../../milestones/milestone-6-live-e2e-testing.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 22
**Status**: Not Started

---

## Objective

Create live tests for public endpoints (health, version) and JWT auth validation against the deployed e1 service.

---

## Steps

### 1. Create `test/live/suites/01-health.live.ts`

- GET /health → 200, body has `status: 'ok'` and `timestamp`
- GET /version → 200, body has `version: '0.1.0'`

### 2. Create `test/live/suites/02-auth.live.ts`

- POST /api/svc/v1/memories/search without Authorization → 401
- POST with `Bearer invalid-token` → 401
- POST with expired JWT → 401 with "expired" in message
- POST with wrong audience JWT → 401
- POST with valid JWT → non-401 (auth passes, endpoint may succeed or fail on business logic)

---

## Verification

- [ ] Health tests pass
- [ ] Auth rejection tests pass for all invalid token scenarios
- [ ] Valid token passes auth guard

---

**Next Task**: [Task 24: Memory & Relationship CRUD Live Tests](task-24-memory-relationship-live-tests.md)
