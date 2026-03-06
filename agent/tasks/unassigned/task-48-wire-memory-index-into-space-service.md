# Task 48: Wire MemoryIndexService into SpaceService Constructors

**Milestone**: Unassigned (breaking change from remember-core v0.33.0)
**Estimated Time**: 0.5-1 hour
**Dependencies**: remember-core v0.33.0+
**Status**: Not Started

---

## Objective

Update all `new SpaceService(...)` constructor calls to pass the now-required `memoryIndexService` as the 6th positional parameter. remember-core v0.33.0 made this a required param — without it, TypeScript compilation will fail.

Note: `MemoryService` calls in this repo already pass `{ memoryIndex }` correctly. Only `SpaceService` calls need updating.

---

## Context

remember-core task-117 changed the `SpaceService` constructor signature from:
```typescript
constructor(weaviateClient, userCollection, userId, confirmationTokenService, logger, options?)
```
to:
```typescript
constructor(weaviateClient, userCollection, userId, confirmationTokenService, logger, memoryIndexService, options?)
```

The `MEMORY_INDEX` NestJS provider already exists in `src/core/core.providers.ts` and is already injected into several controllers. It just needs to be:
1. Injected into the 3 controllers that construct `SpaceService`
2. Passed as the 6th arg to `new SpaceService(...)`

---

## Steps

### 1. Update `src/spaces/spaces.controller.ts`

This controller already has `@Inject(MODERATION_CLIENT)`. Add `@Inject(MEMORY_INDEX)`:

```typescript
@Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
```

Update `getService()` (line 39) and `getPublicReadOnlyService()` (line 52) to pass `this.memoryIndex` as 6th arg:

```typescript
return new SpaceService(
  this.weaviateClient, userCollection, userId,
  this.confirmationTokenService, this.logger,
  this.memoryIndex,
  { moderationClient: this.moderationClient ?? undefined },
);
```

### 2. Update `src/confirmations/confirmations.controller.ts`

Add `@Inject(MEMORY_INDEX)` to constructor. Update `getService()` (line 20):

```typescript
return new SpaceService(
  this.weaviateClient, userCollection, userId,
  this.confirmationTokenService, this.logger,
  this.memoryIndex,
);
```

### 3. Update `src/app/profiles/profiles.controller.ts`

Already has `@Inject(MEMORY_INDEX)`. Update `getSpaceService()` (line 52):

```typescript
return new SpaceService(
  this.weaviateClient, userCollection, userId,
  this.confirmationTokenService, this.logger,
  this.memoryIndex,
);
```

### 4. Update unit tests

Update spec files that mock SpaceService construction:
- `src/spaces/spaces.controller.spec.ts`
- `src/confirmations/confirmations.controller.spec.ts` (if exists)
- `src/app/profiles/profiles.controller.spec.ts`

Ensure `MEMORY_INDEX` provider is included in test module setup where missing.

### 5. Bump remember-core dependency

Update `package.json` to require `@prmichaelsen/remember-core` >= 0.33.0.

### 6. Build and verify

- `tsc --noEmit` passes
- All tests pass

---

## Verification

- [ ] `spaces.controller.ts` — both `getService()` and `getPublicReadOnlyService()` pass `memoryIndex`
- [ ] `confirmations.controller.ts` — `getService()` passes `memoryIndex`
- [ ] `app/profiles/profiles.controller.ts` — `getSpaceService()` passes `memoryIndex`
- [ ] All relevant spec files updated with `MEMORY_INDEX` provider
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

---

## Files Modified

- `src/spaces/spaces.controller.ts` — inject MEMORY_INDEX, pass to SpaceService
- `src/confirmations/confirmations.controller.ts` — inject MEMORY_INDEX, pass to SpaceService
- `src/app/profiles/profiles.controller.ts` — pass existing memoryIndex to SpaceService
- Corresponding `.spec.ts` files — add MEMORY_INDEX provider to test modules
- `package.json` — bump remember-core dependency

---

## Notes

- The `MEMORY_INDEX` provider already exists as a singleton in `src/core/core.providers.ts` and is exported from `CoreModule`
- `profiles.controller.ts` already injects `MEMORY_INDEX` (for MemoryService) — just needs to pass it to SpaceService too
- This ensures published memory UUIDs are written to the Firestore index, fixing 404s on `GET /memories/:id` for space-published memories
