# Task 47: Wire ModerationClient into SpaceService

**Milestone**: Unassigned
**Estimated Time**: 0.5-1 hours
**Dependencies**: remember-core ^0.32.0 (already installed as ^0.32.1)
**Status**: Not Started

---

## Objective

Create a MODERATION_CLIENT NestJS provider using `createModerationClient` from remember-core, inject it into SpacesController, and pass it to SpaceService constructor so that publish/revise requests are content-moderated.

---

## Context

remember-core v0.32.0 added content moderation to SpaceService via an optional `moderationClient` constructor parameter. Moderation is silently skipped if no client is provided. The `ANTHROPIC_API_KEY` env var is already available in remember-rest-service (used by HAIKU_CLIENT).

Design: remember-core `agent/design/local.content-moderation.md`
Upstream task: remember-core `agent/tasks/unassigned/task-115-rest-service-moderation-wiring.md`

---

## Steps

### 1. Add MODERATION_CLIENT provider to core.providers.ts

Create a new NestJS provider symbol and factory that calls `createModerationClient` when `ANTHROPIC_API_KEY` is available, returning `null` otherwise (same pattern as HAIKU_CLIENT).

### 2. Register provider in core.module.ts

Add the provider and export symbol to CoreModule.

### 3. Inject into SpacesController

Add `@Inject(MODERATION_CLIENT)` to SpacesController constructor.

### 4. Pass to SpaceService constructor

Update `getService()` and `getPublicReadOnlyService()` to pass `{ moderationClient }` as the 6th argument to `new SpaceService(...)`.

### 5. Update unit tests

Update `spaces.controller.spec.ts` to provide mock MODERATION_CLIENT and verify SpaceService receives it.

---

## Verification

- [ ] MODERATION_CLIENT provider created in core.providers.ts
- [ ] Provider registered and exported in CoreModule
- [ ] SpacesController injects MODERATION_CLIENT
- [ ] Both getService() and getPublicReadOnlyService() pass moderationClient to SpaceService
- [ ] Unit tests updated and passing
- [ ] No ANTHROPIC_API_KEY set -> moderation disabled (null client, SpaceService skips moderation)

---

## Resources

- remember-core `src/services/moderation.service.ts` — ModerationClient interface + createModerationClient factory
- remember-core `src/services/space.service.ts` line 237 — SpaceService constructor accepts `options?: { moderationClient?: ModerationClient }`

---

## Notes

- Follows same pattern as HAIKU_CLIENT provider (returns null when API key absent)
- ModerationClient has built-in LRU cache, so a singleton provider is appropriate
- SpaceService gracefully skips moderation when moderationClient is undefined
