# Task 63: Unit Tests

**Milestone**: [M18 - Follow-Up Scheduler Endpoint](../../milestones/milestone-18-follow-up-scheduler-endpoint.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 62
**Status**: Not Started

---

## Objective

Unit tests for the scheduler controller endpoint.

---

## Steps

### 1. Create `src/scheduler/scheduler.controller.spec.ts`

Test cases:
- Calls `scanAndNotifyFollowUps` with correct deps shape
- Returns `{ scanned, notified, failed }` from the service
- Handles null EventBus gracefully (webhook not configured)
- Handles scan errors

---

## Verification

- [ ] All tests pass
- [ ] Test file colocated at `src/scheduler/scheduler.controller.spec.ts`
