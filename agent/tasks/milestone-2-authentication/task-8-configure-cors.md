# Task 8: Configure CORS

**Milestone**: [M2 - Authentication & Security](../../milestones/milestone-2-authentication.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 1, Task 3
**Status**: Not Started

---

## Objective

Configure CORS to allow requests from agentbase.me while blocking other origins.

---

## Context

The REST service is consumed by agentbase.me's frontend. CORS must be locked to that origin in production. Development may use localhost origins.

---

## Steps

### 1. Configure CORS in main.ts

Use NestJS's `app.enableCors()` with origin from config (CORS_ORIGIN env var).

### 2. Handle Preflight

Ensure OPTIONS requests are handled correctly for all endpoints.

### 3. Environment-Aware Configuration

Allow multiple origins in development, strict single origin in production.

---

## Verification

- [ ] Requests from agentbase.me origin succeed
- [ ] Requests from other origins are rejected
- [ ] Preflight OPTIONS requests return correct headers
- [ ] CORS origin is configurable via environment variable

---

**Next Task**: [Task 9: Memory Controller](../milestone-3-api-controllers/task-9-memory-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
