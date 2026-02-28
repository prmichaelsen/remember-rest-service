# Milestone 4: Observability & Testing

**Goal**: Add structured logging with PII redaction and comprehensive test coverage
**Duration**: 1 week
**Dependencies**: M1, M2, M3
**Status**: Not Started

---

## Overview

This milestone adds production-grade observability and test coverage. The logging interceptor captures request/response data with PII redaction to prevent sensitive data from entering logs. Integration tests verify end-to-end flows across controllers, auth, and remember-core services.

---

## Deliverables

### 1. Logging Interceptor
- Request/response logging with structured output
- PII redaction processor (content fields, user data)
- Configurable log levels per environment
- Request timing and correlation IDs

### 2. Integration Tests
- Auth flow e2e tests (full JWT lifecycle)
- Memory CRUD e2e tests
- Search e2e tests
- Error handling e2e tests

---

## Success Criteria

- [ ] All requests produce structured log entries
- [ ] PII fields (content, email, etc.) are redacted in logs
- [ ] Integration tests pass against test infrastructure
- [ ] Unit test coverage meets targets (controllers 80%+, guards/filters 90%+)
- [ ] Tests use colocated file convention (*.spec.ts, *.e2e.ts)

---

## Tasks

15. [Task 15: Logging Interceptor](../tasks/milestone-4-observability-testing/task-15-logging-interceptor.md) - Structured logging with PII redaction
16. [Task 16: Unit Test Coverage](../tasks/milestone-4-observability-testing/task-16-unit-test-coverage.md) - Fill spec.ts coverage gaps
17. [Task 17: Integration Tests](../tasks/milestone-4-observability-testing/task-17-integration-tests.md) - E2E tests for key flows

---

## Testing Requirements

- [ ] Logging interceptor unit tests (logging.interceptor.spec.ts)
- [ ] PII redaction unit tests
- [ ] Integration test suite runs in CI

---

**Next Milestone**: [M5: Cloud Run Deployment](milestone-5-cloud-run-deployment.md)
**Blockers**: None
**Notes**: Integration tests may require test Weaviate/Firestore instances or mocks
