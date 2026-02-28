# Task 13: Preferences Controller

**Milestone**: [M3 - API Controllers](../../milestones/milestone-3-api-controllers.md)
**Estimated Time**: 1-2 hours
**Dependencies**: Task 2, Task 5, Task 6
**Status**: Not Started

---

## Objective

Implement the preferences controller with 2 endpoints for getting and updating user preferences.

---

## Context

User preferences (search defaults, privacy settings, display options, etc.) are stored in Firestore via remember-core's PreferencesDatabaseService. The controller exposes GET and PATCH endpoints.

---

## Steps

### 1. Create DTOs

- UpdatePreferencesDto (partial update of all preference sections)

### 2. Create Preferences Controller

| Method | Path | Service Method |
|--------|------|----------------|
| GET | `/api/svc/v1/preferences` | getPreferences(userId) |
| PATCH | `/api/svc/v1/preferences` | updatePreferences(userId, updates) |

### 3. Create Module and Write Tests

---

## Verification

- [ ] GET returns current user preferences
- [ ] PATCH updates specified fields and returns updated preferences
- [ ] preferences.controller.spec.ts passes

---

**Next Task**: [Task 14: Trust Controller](task-14-trust-controller.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
