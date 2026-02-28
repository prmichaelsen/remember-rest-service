# Milestone 2: Authentication & Security

**Goal**: Implement JWT authentication guard, rate limiting, and CORS configuration
**Duration**: 1 week
**Dependencies**: M1 - Project Scaffolding & Core Integration
**Status**: Not Started

---

## Overview

This milestone adds the security layer to the REST service. It implements JWT token validation (matching the pattern used by agentbase.me), rate limiting to prevent abuse, and CORS configuration locked to agentbase.me. The auth guard extracts userId from JWT claims and attaches it to the request context for downstream controllers.

---

## Deliverables

### 1. Auth Module
- JWT auth guard (validates Bearer tokens)
- Auth types (JWTPayload, AuthContext)
- User decorator for extracting userId in controllers
- Auth module exporting guard and utilities

### 2. Rate Limiting
- Global rate limiter (configurable requests/window)
- Per-endpoint rate limiting support
- Rate limit headers in responses (X-RateLimit-*)

### 3. CORS Configuration
- Locked to agentbase.me origin (configurable via env)
- Proper preflight handling

---

## Success Criteria

- [ ] Requests without Authorization header return 401
- [ ] Requests with invalid JWT return 401
- [ ] Requests with expired JWT return 401
- [ ] Requests with valid JWT pass through with userId attached
- [ ] Rate-limited requests return 429 with Retry-After header
- [ ] Cross-origin requests from agentbase.me succeed
- [ ] Cross-origin requests from other origins are rejected
- [ ] Health/version endpoints remain accessible without auth

---

## Tasks

6. [Task 6: Implement JWT Auth Guard](../tasks/milestone-2-authentication/task-6-implement-jwt-auth-guard.md) - JWT validation, userId extraction, user decorator
7. [Task 7: Implement Rate Limiting](../tasks/milestone-2-authentication/task-7-implement-rate-limiting.md) - Global and per-endpoint rate limits
8. [Task 8: Configure CORS](../tasks/milestone-2-authentication/task-8-configure-cors.md) - Origin-locked CORS setup

---

## Environment Variables

```env
# Auth
PLATFORM_SERVICE_TOKEN=          # JWT signing secret (shared with agentbase.me)
JWT_ISSUER=agentbase.me
JWT_AUDIENCE=svc

# CORS
CORS_ORIGIN=https://agentbase.me

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=3600000
```

---

## Testing Requirements

- [ ] Auth guard unit tests (auth.guard.spec.ts)
- [ ] Rate limiting unit tests
- [ ] CORS integration test (cors.e2e.ts)

---

**Next Milestone**: [M3: API Controllers](milestone-3-api-controllers.md)
**Blockers**: None
**Notes**: Auth library will be extracted to a reusable package later; implement directly in this service first
