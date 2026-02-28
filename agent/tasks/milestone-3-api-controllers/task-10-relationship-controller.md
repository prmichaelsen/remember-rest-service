# Task 10: Relationship Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 2, Task 5, Task 6, Task 9
**Status**: Not Started

---

## Objective

Implement the relationship controller with 4 endpoints wrapping remember-core's RelationshipService.

---

## Context

Follows the same pattern established by the memory controller (Task 9).

---

## Steps

### 1. Create DTOs

- CreateRelationshipDto (memory_ids, relationship_type, observation, strength, confidence)
- SearchRelationshipDto (type, strength, confidence, tags, filters)
- UpdateRelationshipDto (partial fields)

### 2. Create Relationship Controller

| Method | Path | Service Method |
|--------|------|----------------|
| POST | `/api/svc/v1/relationships` | create |
| POST | `/api/svc/v1/relationships/search` | search |
| PATCH | `/api/svc/v1/relationships/:id` | update |
| DELETE | `/api/svc/v1/relationships/:id` | delete |

### 3. Create Module and Write Tests

---

## Verification

- [ ] All 4 endpoints work correctly
- [ ] DTO validation works
- [ ] relationships.controller.spec.ts passes

---

**Next Task**: [Task 11: Space Controller](task-11-space-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
