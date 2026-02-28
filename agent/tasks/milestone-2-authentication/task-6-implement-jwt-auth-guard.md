# Task 6: Implement JWT Auth Guard

**Milestone**: [M2 - Authentication & Security](../../milestones/milestone-2-authentication.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 1, Task 3
**Status**: Not Started

---

## Objective

Implement a NestJS guard that validates JWT Bearer tokens, extracts userId, and attaches it to the request context. Create a `@User()` parameter decorator for controllers to access the authenticated userId.

---

## Context

JWTs are issued by agentbase.me with `sub` (userId), `iss` (agentbase.me), and `aud` (svc). The guard validates signature using the service token, checks issuer/audience claims, and rejects expired tokens. Health/version endpoints are excluded via a `@Public()` decorator.

---

## Steps

### 1. Define Auth Types

```typescript
interface JWTPayload {
  sub: string;          // userId
  iss: 'agentbase.me';
  aud: 'svc' | 'web';
  iat: number;
  exp: number;
}
```

### 2. Create Auth Guard

- Extract Bearer token from Authorization header
- Verify JWT using `jsonwebtoken` with service token
- Validate issuer and audience claims
- Attach userId to request object
- Return 401 UnauthorizedError for any failure

### 3. Create @Public() Decorator

Metadata decorator that marks endpoints as public (skipped by auth guard).

### 4. Create @User() Decorator

Parameter decorator that extracts userId from request.

### 5. Create Auth Module

Register guard as global guard, export decorators.

### 6. Write Unit Tests

Test valid token, invalid signature, expired token, missing token, wrong issuer, wrong audience.

---

## Verification

- [ ] Valid JWT passes guard and userId is accessible via @User()
- [ ] Missing Authorization header returns 401
- [ ] Invalid JWT signature returns 401
- [ ] Expired JWT returns 401
- [ ] Wrong issuer returns 401
- [ ] Wrong audience returns 401
- [ ] @Public() endpoints skip auth
- [ ] auth.guard.spec.ts passes

---

**Next Task**: [Task 7: Implement Rate Limiting](task-7-implement-rate-limiting.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
