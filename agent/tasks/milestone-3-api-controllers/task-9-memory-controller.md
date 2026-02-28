# Task 9: Memory Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 4-6 hours
**Dependencies**: Task 2, Task 5, Task 6
**Status**: Not Started

---

## Objective

Implement the memory controller with 6 endpoints wrapping remember-core's MemoryService. Create request/response DTOs with validation.

---

## Context

This is the first and most complex controller. It establishes the pattern for all subsequent controllers: thin adapter wrapping a remember-core service, with DTOs for validation, @User() for auth context, and error filter for error handling.

---

## Steps

### 1. Create DTOs

- CreateMemoryDto (content, type, weight, trust, tags, etc.)
- SearchMemoryDto (query, alpha, filters, limit, offset, etc.)
- FindSimilarDto (memory_id or text)
- QueryMemoryDto (query, filters, limit, offset)
- UpdateMemoryDto (partial: content, type, weight, trust, tags, relationships)
- DeleteMemoryDto (deletion_reason)

### 2. Create Memory Controller

| Method | Path | Service Method |
|--------|------|----------------|
| POST | `/api/svc/v1/memories` | create |
| POST | `/api/svc/v1/memories/search` | search |
| POST | `/api/svc/v1/memories/similar` | findSimilar |
| POST | `/api/svc/v1/memories/query` | query |
| PATCH | `/api/svc/v1/memories/:id` | update |
| DELETE | `/api/svc/v1/memories/:id` | delete |

### 3. Create Memory Module

Register controller, inject MemoryService from core module.

### 4. Write Unit Tests

Test each endpoint with mocked MemoryService. Test DTO validation rejects invalid input.

---

## Verification

- [ ] All 6 endpoints respond with correct HTTP methods/status
- [ ] Invalid DTOs return 400 with validation details
- [ ] Response format matches remember-core types
- [ ] memories.controller.spec.ts passes
- [ ] memories.dto.spec.ts passes (validation tests)

---

**Next Task**: [Task 10: Relationship Controller](task-10-relationship-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
