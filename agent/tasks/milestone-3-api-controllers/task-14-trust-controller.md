# Task 14: Trust Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 2, Task 5, Task 6
**Status**: Not Started

---

## Objective

Implement the trust controller with 7 endpoints for ghost configuration, per-user trust management, blocking, and access checking.

---

## Context

The trust/ghost system controls cross-user memory visibility. Ghost config determines trust levels per user, and access checks enforce those levels. This controller wraps GhostConfigService and TrustEnforcementService from remember-core.

---

## Steps

### 1. Create DTOs

- UpdateGhostConfigDto (enabled, default trust levels, enforcement mode)
- SetUserTrustDto (target_user_id, trust_level)
- TargetUserDto (target_user_id) — shared by remove-trust, block, unblock
- CheckAccessDto (memory_id, accessor_user_id)

### 2. Create Trust Controller

| Method | Path | Service Method |
|--------|------|----------------|
| GET | `/api/svc/v1/trust/ghost-config` | GhostConfigHandlerService.handleGetConfig |
| PATCH | `/api/svc/v1/trust/ghost-config` | GhostConfigHandlerService.handleUpdateConfig |
| POST | `/api/svc/v1/trust/set-user-trust` | GhostConfigHandlerService.handleSetTrust |
| POST | `/api/svc/v1/trust/remove-user-trust` | GhostConfigHandlerService.handleRemoveTrust |
| POST | `/api/svc/v1/trust/block-user` | GhostConfigHandlerService.handleBlockUser |
| POST | `/api/svc/v1/trust/unblock-user` | GhostConfigHandlerService.handleUnblockUser |
| POST | `/api/svc/v1/trust/check-access` | TrustEnforcementService.checkMemoryAccess |

### 3. Create Module and Write Tests

---

## Verification

- [ ] GET ghost-config returns current config
- [ ] PATCH ghost-config updates config
- [ ] POST set-user-trust sets trust level
- [ ] POST remove-user-trust reverts to default
- [ ] POST block-user blocks a user
- [ ] POST unblock-user unblocks a user
- [ ] POST check-access returns correct AccessResult
- [ ] trust.controller.spec.ts passes

---

**Next Task**: [Task 15: Logging Interceptor](../milestone-4-observability-testing/task-15-logging-interceptor.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
