# Task 17: Integration Tests

**Milestone**: [M4 - Observability & Testing](../../milestones/milestone-4-observability-testing.md)
**Estimated Time**: 4-6 hours
**Dependencies**: Tasks 1-14
**Status**: Not Started

---

## Objective

Write end-to-end integration tests (*.e2e.ts) that verify complete request flows through the NestJS application, including auth, controllers, and remember-core services.

---

## Context

Integration tests use NestJS testing utilities to bootstrap the full application with mocked or test database instances. They verify that the full request lifecycle works correctly: auth guard -> controller -> remember-core service -> response.

---

## Steps

### 1. Set Up Test Infrastructure

Configure NestJS TestingModule with mock Weaviate/Firestore providers or test instances.

### 2. Write Auth Flow Tests

- auth.e2e.ts: Valid token, invalid token, expired token, missing token, wrong audience

### 3. Write Memory CRUD Tests

- memories.controller.e2e.ts: Create, search, update, delete lifecycle

### 4. Write Error Handling Tests

- error-handling.e2e.ts: Verify error responses for validation errors, not found, etc.

---

## Verification

- [ ] Auth e2e tests pass
- [ ] Memory CRUD e2e tests pass
- [ ] Error handling e2e tests pass
- [ ] All e2e tests use colocated *.e2e.ts convention

---

**Next Task**: [Task 18: Create Dockerfile](../milestone-5-cloud-run-deployment/task-18-create-dockerfile.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
