# Task 12: Confirmation Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 2, Task 5, Task 6
**Status**: Not Started

---

## Objective

Implement the confirmation controller with 2 endpoints for confirming/denying pending actions.

---

## Context

Space operations (publish, retract, revise) generate confirmation tokens. This controller exposes endpoints to confirm or deny those tokens.

---

## Steps

### 1. Create Confirmation Controller

| Method | Path | Service Method |
|--------|------|----------------|
| POST | `/api/svc/v1/confirmations/:token/confirm` | SpaceService.confirm |
| POST | `/api/svc/v1/confirmations/:token/deny` | SpaceService.deny |

### 2. Create Module and Write Tests

---

## Verification

- [ ] Confirm endpoint accepts valid token and executes action
- [ ] Deny endpoint accepts valid token and rejects action
- [ ] Invalid/expired tokens return appropriate errors
- [ ] confirmations.controller.spec.ts passes

---

**Next Task**: [Task 13: Preferences Controller](task-13-preferences-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
