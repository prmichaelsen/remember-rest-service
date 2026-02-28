# Task 4: Create Health Endpoints

**Milestone**: [M1 - Project Scaffolding & Core Integration](../../milestones/milestone-1-project-scaffolding.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 1, Task 3
**Status**: Not Started

---

## Objective

Create public (unauthenticated) health check and version endpoints.

---

## Context

Cloud Run uses the health endpoint to determine service readiness. The version endpoint helps with debugging deployed instances. Both must be accessible without JWT authentication.

---

## Steps

### 1. Create Health Controller

- GET /health — returns `{ status: "ok", timestamp: "..." }`
- GET /version — returns `{ version: "0.1.0", environment: "..." }`

### 2. Create Health Module

Register the controller. Ensure it's excluded from the auth guard.

### 3. Write Unit Tests

Test both endpoints return expected shapes.

---

## Verification

- [ ] GET /health returns 200 with status
- [ ] GET /version returns 200 with version from package.json
- [ ] Neither endpoint requires authentication
- [ ] health.controller.spec.ts passes

---

**Next Task**: [Task 5: Create Error Filter](task-5-create-error-filter.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
