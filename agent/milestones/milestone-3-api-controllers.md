# Milestone 3: API Controllers

**Goal**: Implement all REST controllers wrapping remember-core services with request validation and DTOs
**Duration**: 1-2 weeks
**Dependencies**: M1, M2
**Status**: Not Started

---

## Overview

This milestone implements the core API surface. Each remember-core service gets a NestJS controller with typed DTOs, request validation, and proper HTTP method mapping. All endpoints are protected by the JWT auth guard from M2 and use the error filter from M1. Controllers are thin adapters that delegate to remember-core services.

---

## Deliverables

### 1. Memory Controller
- POST /api/svc/v1/memories (create)
- POST /api/svc/v1/memories/search (hybrid search)
- POST /api/svc/v1/memories/similar (vector similarity)
- POST /api/svc/v1/memories/query (semantic query)
- PATCH /api/svc/v1/memories/:id (update)
- DELETE /api/svc/v1/memories/:id (soft delete)

### 2. Relationship Controller
- POST /api/svc/v1/relationships (create)
- POST /api/svc/v1/relationships/search (search)
- PATCH /api/svc/v1/relationships/:id (update)
- DELETE /api/svc/v1/relationships/:id (delete)

### 3. Space Controller
- POST /api/svc/v1/spaces/publish
- POST /api/svc/v1/spaces/retract
- POST /api/svc/v1/spaces/revise
- POST /api/svc/v1/spaces/moderate
- POST /api/svc/v1/spaces/search
- POST /api/svc/v1/spaces/query

### 4. Confirmation Controller
- POST /api/svc/v1/confirmations/:token/confirm
- POST /api/svc/v1/confirmations/:token/deny

### 5. Preferences Controller
- GET /api/svc/v1/preferences
- PATCH /api/svc/v1/preferences

### 6. Trust Controller
- GET /api/svc/v1/trust/ghost-config
- PATCH /api/svc/v1/trust/ghost-config
- POST /api/svc/v1/trust/set-user-trust
- POST /api/svc/v1/trust/remove-user-trust
- POST /api/svc/v1/trust/block-user
- POST /api/svc/v1/trust/unblock-user
- POST /api/svc/v1/trust/check-access

---

## Success Criteria

- [ ] All 26 endpoints respond with correct HTTP methods
- [ ] Invalid request bodies return 400 with validation details
- [ ] All endpoints require valid JWT (except health/version)
- [ ] Response format matches remember-core types (SearchResult, PaginatedResult)
- [ ] Error responses use structured format from error filter
- [ ] DTOs validate all required fields

---

## Tasks

9. [Task 9: Memory Controller](../tasks/milestone-3-api-controllers/task-9-memory-controller.md) - 6 endpoints + DTOs
10. [Task 10: Relationship Controller](../tasks/milestone-3-api-controllers/task-10-relationship-controller.md) - 4 endpoints + DTOs
11. [Task 11: Space Controller](../tasks/milestone-3-api-controllers/task-11-space-controller.md) - 6 endpoints + DTOs
12. [Task 12: Confirmation Controller](../tasks/milestone-3-api-controllers/task-12-confirmation-controller.md) - 2 endpoints + DTOs
13. [Task 13: Preferences Controller](../tasks/milestone-3-api-controllers/task-13-preferences-controller.md) - 2 endpoints + DTOs
14. [Task 14: Trust Controller](../tasks/milestone-3-api-controllers/task-14-trust-controller.md) - 7 endpoints + DTOs

---

## Testing Requirements

- [ ] Unit tests for each controller (*.spec.ts)
- [ ] DTO validation tests

---

**Next Milestone**: [M4: Observability & Testing](milestone-4-observability-testing.md)
**Blockers**: None
**Notes**: Controllers should be implemented in order (memories first) as they establish the pattern for the rest
