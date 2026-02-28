# Task 7: Implement Rate Limiting

**Milestone**: [M2 - Authentication & Security](../../milestones/milestone-2-authentication.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 1, Task 3
**Status**: Not Started

---

## Objective

Implement global rate limiting with configurable limits per time window. Include rate limit headers in responses.

---

## Context

Rate limiting prevents abuse and protects backend resources. The default is 100 requests per hour per IP/user. Public endpoints (health, version) should also be rate-limited but with higher thresholds.

---

## Steps

### 1. Install Rate Limiting Package

Use `@nestjs/throttler` or implement a simple in-memory rate limiter.

### 2. Configure Global Rate Limiting

Set default limits from config (RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS).

### 3. Add Rate Limit Headers

Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` in responses.

### 4. Write Unit Tests

Test that requests within limit succeed and requests exceeding limit return 429.

---

## Verification

- [ ] Requests within limit return normally
- [ ] Requests exceeding limit return 429
- [ ] Rate limit headers present in responses
- [ ] Configurable via environment variables
- [ ] Rate limit tests pass

---

**Next Task**: [Task 8: Configure CORS](task-8-configure-cors.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
