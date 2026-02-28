# Task 11: Space Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 2, Task 5, Task 6, Task 9
**Status**: Not Started

---

## Objective

Implement the space controller with 6 endpoints wrapping remember-core's SpaceService.

---

## Context

The space service handles publishing memories to shared spaces, retracting, revising, moderating, and searching shared content. It's the most endpoint-rich controller after memories.

---

## Steps

### 1. Create DTOs

- PublishDto, RetractDto, ReviseDto, ModerateDto
- SearchSpaceDto, QuerySpaceDto

### 2. Create Space Controller

| Method | Path | Service Method |
|--------|------|----------------|
| POST | `/api/svc/v1/spaces/publish` | publish |
| POST | `/api/svc/v1/spaces/retract` | retract |
| POST | `/api/svc/v1/spaces/revise` | revise |
| POST | `/api/svc/v1/spaces/moderate` | moderate |
| POST | `/api/svc/v1/spaces/search` | search |
| POST | `/api/svc/v1/spaces/query` | query |

### 3. Create Module and Write Tests

---

## Verification

- [ ] All 6 endpoints work correctly
- [ ] DTO validation works
- [ ] spaces.controller.spec.ts passes

---

**Next Task**: [Task 12: Confirmation Controller](task-12-confirmation-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
