# Task 27: Implement App Tier Routes (/api/app/v1/)

**Milestone**: M7 - App Tier Routes
**Estimated Time**: 6-8 hours
**Dependencies**: M3 (API Controllers complete)
**Status**: Not Started

---

## Objective

Implement the `/api/app/v1/` routes matching the remember-core app client SDK. These are use-case-oriented compound endpoints that collapse multi-step service operations into single calls.

---

## Context

The remember-core app client SDK (`@prmichaelsen/remember-core/app`) defines 5 methods (profiles 4 + ghost 1) that call `/api/app/v1/` routes. These routes don't exist on remember-rest-service yet. The OpenAPI spec is at `remember-core/docs/openapi-web.yaml`.

The app tier differs from the svc tier:
- Profile operations are first-class (create+publish, search, retract, update+republish in one call)
- Ghost context is resolved server-side
- `searchAsGhost` compound operation resolves trust internally

The app client SDK expects these 5 endpoints:
1. `POST /api/app/v1/profiles` — createAndPublish (compound: create memory + publish to profiles space)
2. `PATCH /api/app/v1/profiles/:memoryId` — updateAndRepublish (compound: update memory + republish)
3. `DELETE /api/app/v1/profiles/:memoryId` — retract (retract from profiles space)
4. `POST /api/app/v1/profiles/search` — search published profiles
5. `POST /api/app/v1/trust/search-as-ghost` — searchAsGhost (compound: resolve trust + search + redact)

**Note**: The full OpenAPI spec defines 32 endpoints, but the app client SDK only uses these 5. Start with what the client needs. The remaining endpoints (memories, relationships, spaces, trust, preferences) are already covered by the svc tier.

---

## Steps

### 1. Create AppModule

Create a NestJS module for the app tier at `src/app/app.module.ts`:
- Import CoreModule for remember-core service access
- Register profile and ghost controllers
- Mount at `/api/app/v1/` prefix

### 2. Create ProfilesController

Create `src/app/profiles/profiles.controller.ts`:
- `POST /` — createAndPublish
  - Body: `{ display_name, bio?, tags? }`
  - Create memory (type=person, content=JSON of profile fields)
  - Publish to 'profiles' space
  - Return `{ memory_id, space_id, composite_id }`
- `PATCH /:memoryId` — updateAndRepublish
  - Body: `{ display_name?, bio?, tags? }`
  - Update memory content
  - Republish to profiles space
  - Return `{ memory_id, composite_id }`
- `DELETE /:memoryId` — retract
  - No body
  - Retract from profiles space
  - Return `{ retracted: true }`
- `POST /search` — search
  - Body: `{ query, limit?, offset? }`
  - Search 'profiles' space, enrich results with user_id + structured fields
  - Return `{ profiles[], total, offset, limit, hasMore }`

### 3. Create GhostSearchController

Create `src/app/trust/ghost.controller.ts`:
- `POST /search-as-ghost` — searchAsGhost
  - Body: `{ owner_user_id, query, limit?, offset? }`
  - Resolve caller's trust level for owner_user_id from ghost config
  - Build GhostSearchContext `{ accessor_trust_level, owner_user_id, include_ghost_content }`
  - Search owner's memories with ghost context
  - Redact results based on trust tier
  - Return `{ memories[], total, offset, limit, hasMore, trust_tier }`

### 4. Register App Routes

- Add AppModule to root module
- Ensure `/api/app/v1/` prefix via controller decorators or module config
- Auth guard applies (same JWT auth as svc tier)

### 5. Write Tests

- Unit tests for ProfileController (4 endpoints)
- Unit tests for GhostController (1 endpoint)
- Colocated spec files per project convention

---

## Verification

- [ ] `POST /api/app/v1/profiles` creates and publishes a profile in one call
- [ ] `PATCH /api/app/v1/profiles/:memoryId` updates and republishes a profile
- [ ] `DELETE /api/app/v1/profiles/:memoryId` retracts a profile
- [ ] `POST /api/app/v1/profiles/search` returns profiles from spaces
- [ ] `POST /api/app/v1/trust/search-as-ghost` performs ghost-scoped search
- [ ] All 5 endpoints require JWT auth
- [ ] Unit tests pass for both controllers
- [ ] `npm test` — all tests pass
- [ ] `npm run test:e2e` — all tests pass

---

## Expected Output

**Files Created**:
- `src/app/app.module.ts` — App tier NestJS module
- `src/app/profiles/profiles.controller.ts` — Profile endpoints
- `src/app/profiles/profiles.controller.spec.ts` — Profile tests
- `src/app/profiles/profiles.dto.ts` — Profile DTOs
- `src/app/trust/ghost.controller.ts` — Ghost search endpoint
- `src/app/trust/ghost.controller.spec.ts` — Ghost tests
- `src/app/trust/ghost.dto.ts` — Ghost DTOs

---

## Resources

- [OpenAPI Spec](remember-core/docs/openapi-web.yaml) — App tier API specification
- [App Client SDK](remember-core/src/app/) — Client that consumes these routes
- [Svc Controllers](src/controllers/) — Existing svc tier controllers as reference

---

## Notes

- The app tier reuses the same CoreModule services as the svc tier
- Profile compound operations internally use MemoryService + SpaceService + ConfirmationTokenService
- searchAsGhost uses GhostConfigHandlerService + MemoryService + TrustEnforcementService
- Start with the 5 endpoints the client SDK actually calls, not all 32 from the full spec

---

**Next Task**: N/A
**Related Design Docs**: remember-core/agent/design/local.client-sdk-architecture.md
**Estimated Completion Date**: TBD
