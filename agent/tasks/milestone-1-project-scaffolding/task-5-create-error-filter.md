# Task 5: Create Error Filter

**Milestone**: [M1 - Project Scaffolding & Core Integration](../../milestones/milestone-1-project-scaffolding.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 1
**Status**: Not Started

---

## Objective

Create a global NestJS exception filter that catches remember-core AppError instances and maps them to HTTP responses with the correct status code and structured error body.

---

## Context

Remember-core defines 8 error types (ValidationError, UnauthorizedError, etc.) each with a `kind` property and an HTTP status mapping via `HTTP_STATUS`. The filter catches these and returns consistent JSON error responses. Unhandled errors should fall through to NestJS's default 500 handler.

---

## Steps

### 1. Create AppErrorFilter

Implement `@Catch(AppError)` exception filter that:
- Extracts HTTP status from `HTTP_STATUS[error.kind]`
- Returns `{ error: error.toJSON() }` as response body
- Logs the error at appropriate level

### 2. Register Globally

Add the filter as a global filter in app.module.ts or main.ts.

### 3. Create Fallback Filter

Handle unexpected errors (non-AppError) with a 500 response and sanitized message (no stack traces in production).

### 4. Write Unit Tests

Test each error kind maps to the correct HTTP status. Test unknown errors return 500.

---

## Verification

- [ ] ValidationError returns 400
- [ ] UnauthorizedError returns 401
- [ ] ForbiddenError returns 403
- [ ] NotFoundError returns 404
- [ ] ConflictError returns 409
- [ ] RateLimitError returns 429
- [ ] ExternalError returns 502
- [ ] InternalError returns 500
- [ ] Unknown errors return 500 without stack traces
- [ ] app-error.filter.spec.ts passes

---

**Next Task**: [Task 6: Implement JWT Auth Guard](../milestone-2-authentication/task-6-implement-jwt-auth-guard.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
