# Task 25: Preferences, Trust & Spaces Live Tests

**Milestone**: [M6 - Live E2E Testing](../../milestones/milestone-6-live-e2e-testing.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 22, Task 23
**Status**: Not Started

---

## Objective

Create live tests for preferences, trust management, and spaces endpoints against the deployed e1 service.

---

## Steps

### 1. Create `test/live/suites/05-preferences.live.ts`

Lifecycle:
1. GET /api/svc/v1/preferences — get current preferences
2. PATCH /api/svc/v1/preferences — update a preference (e.g. search.default_limit)
3. GET /api/svc/v1/preferences — verify update took effect
4. PATCH /api/svc/v1/preferences — revert to original

### 2. Create `test/live/suites/06-trust.live.ts`

Lifecycle:
1. GET /api/svc/v1/trust/ghost-config — get current config
2. PATCH /api/svc/v1/trust/ghost-config — update config
3. POST /api/svc/v1/trust/set-user-trust — set trust for target user
4. POST /api/svc/v1/trust/check-access — check access (needs a memory_id)
5. POST /api/svc/v1/trust/remove-user-trust — remove trust
6. POST /api/svc/v1/trust/block-user — block target user
7. POST /api/svc/v1/trust/unblock-user — unblock target user
8. PATCH /api/svc/v1/trust/ghost-config — revert config

### 3. Create `test/live/suites/07-spaces.live.ts`

Lifecycle:
1. Create a memory as prerequisite
2. POST /api/svc/v1/spaces/publish — publish memory to space
3. POST /api/svc/v1/spaces/search — search within space
4. POST /api/svc/v1/spaces/query — query space semantically
5. POST /api/svc/v1/spaces/revise — revise published memory
6. POST /api/svc/v1/spaces/moderate — moderate memory in space
7. POST /api/svc/v1/spaces/retract — retract from space
8. afterAll cleanup (delete prerequisite memory)

---

## Verification

- [ ] Preferences GET/PATCH lifecycle works
- [ ] Trust management endpoints respond correctly
- [ ] Spaces publish/search/retract lifecycle works
- [ ] All test data cleaned up

---

**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
