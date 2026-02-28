# Task 15: Logging Interceptor

**Milestone**: [M4 - Observability & Testing](../../milestones/milestone-4-observability-testing.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 1, Task 3
**Status**: Not Started

---

## Objective

Create a NestJS interceptor that logs requests and responses with structured output, including PII redaction to prevent sensitive data from entering logs.

---

## Context

Following core-sdk logging patterns, the interceptor provides structured JSON logs with request timing, correlation IDs, and content-aware PII redaction. Memory content, user emails, and other sensitive fields must be redacted before logging.

---

## Steps

### 1. Define PII Redaction Rules

Identify fields to redact: `content`, `email`, `summary`, `observation`, service account keys. Replace with `[REDACTED]`.

### 2. Create Logging Interceptor

- Log request: method, path, userId, correlation ID
- Log response: status code, duration (ms)
- Redact PII from request/response bodies before logging
- Use remember-core's Logger

### 3. Register Globally

Add interceptor in app.module.ts.

### 4. Write Unit Tests

Test PII redaction on various payload shapes. Test timing is captured correctly.

---

## Verification

- [ ] All requests produce structured log entries
- [ ] PII fields are redacted in logs
- [ ] Request duration is captured
- [ ] Correlation IDs are present
- [ ] logging.interceptor.spec.ts passes

---

**Next Task**: [Task 16: Unit Test Coverage](task-16-unit-test-coverage.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
