# Milestone 21: OpenAPI Spec Route Compliance

## Goal
Implement all routes defined in remember-core's OpenAPI specs (openapi.yaml svc-tier and openapi-web.yaml app-tier) that are missing from the REST service. After this milestone, every route in both specs has a corresponding controller endpoint.

## Context
An audit against remember-core's OpenAPI specs revealed:
- **4 svc-tier routes** missing (3 engagement counters + spaces/by-recommendation)
- **~24 app-tier routes** missing (memory CRUD, relationship CRUD, spaces ops, trust ops, preferences, compound with-relationships endpoint)

The app-tier routes are mostly pass-through wrappers that delegate to the same remember-core services already used by the svc-tier controllers. Existing DTOs from the svc-tier can be reused where shapes match.

## Deliverables
1. Svc-tier engagement counter endpoints (click, share, comment-count)
2. Svc-tier spaces/by-recommendation endpoint
3. App-tier memory CRUD + search + compound with-relationships endpoint
4. App-tier relationship CRUD + search pass-through
5. App-tier spaces pass-through (publish, retract, revise, moderate, search, query)
6. App-tier trust pass-through (ghost-config get/patch, set/remove-user-trust, block/unblock-user, check-access)
7. App-tier preferences pass-through (get, patch)
8. Unit tests for all new endpoints

## Success Criteria
- [ ] Every route in openapi.yaml has a matching svc-tier controller endpoint
- [ ] Every route in openapi-web.yaml has a matching app-tier controller endpoint
- [ ] All new endpoints have unit tests
- [ ] Existing tests pass with no regressions

## Tasks
- Task 69: Svc-Tier Missing Endpoints (engagement counters + spaces/by-recommendation)
- Task 70: App-Tier Memory & Relationship Pass-Through
- Task 71: App-Tier Spaces, Trust & Preferences Pass-Through
- Task 72: Unit Tests

## Estimated Duration
1 week

## Dependencies
- M3 (API Controllers) — existing svc-tier controllers and DTOs
- M7 (App Tier Routes) — existing app-tier controller patterns
- remember-core >= 0.68.0 (already installed)
