# Task 71: App-Tier Spaces, Trust & Preferences Pass-Through

## Objective
Add the remaining app-tier pass-through endpoints for spaces, trust, and preferences defined in openapi-web.yaml.

## Missing Spaces Endpoints (new or extend AppSpacesController)
Existing controller only has `POST /comments`. Add:
1. `POST /api/app/v1/spaces/publish` — publish memory to spaces
2. `POST /api/app/v1/spaces/retract` — retract from spaces
3. `POST /api/app/v1/spaces/revise` — revise content in space
4. `POST /api/app/v1/spaces/moderate` — moderate space content
5. `POST /api/app/v1/spaces/search` — search shared spaces
6. `POST /api/app/v1/spaces/query` — semantic query spaces

## Missing Trust Endpoints (new AppTrustController or extend GhostController)
Existing GhostController only has `POST /search-as-ghost`. Add:
1. `GET /api/app/v1/trust/ghost-config` — get ghost config
2. `PATCH /api/app/v1/trust/ghost-config` — update ghost config
3. `POST /api/app/v1/trust/set-user-trust` — set per-user trust
4. `POST /api/app/v1/trust/remove-user-trust` — remove per-user trust
5. `POST /api/app/v1/trust/block-user` — block user
6. `POST /api/app/v1/trust/unblock-user` — unblock user
7. `POST /api/app/v1/trust/check-access` — check memory access

## Missing Preferences Endpoints (new AppPreferencesController)
1. `GET /api/app/v1/preferences` — get preferences
2. `PATCH /api/app/v1/preferences` — update preferences

## Context
- All endpoints are pass-throughs reusing existing svc-tier DTOs
- Spaces pass-throughs use existing PublishDto, RetractDto, ReviseDto, ModerateDto, SearchSpaceDto, QuerySpaceDto
- Trust pass-throughs use existing TrustDto, GhostConfigDto
- Preferences pass-throughs use existing PreferencesDto, UpdatePreferencesDto
- openapi-web.yaml references: lines 548-697 (spaces), 729-931 (trust), 936-968 (preferences)

## Steps

### 1. Extend AppSpacesController
- Add publish, retract, revise, moderate, search, query handlers
- Reuse svc-tier DTOs
- Same service instantiation pattern as existing comments handler

### 2. Extend GhostController → AppTrustController
- Rename or extend `src/app/trust/ghost.controller.ts` to handle all trust operations
- Add ghost-config get/patch, set/remove-user-trust, block/unblock-user, check-access
- Reuse svc-tier trust DTOs

### 3. Create AppPreferencesController
- New controller at `src/app/preferences/app-preferences.controller.ts`
- Add get and update handlers
- Reuse svc-tier PreferencesDto, UpdatePreferencesDto
- Register in AppTierModule

## Verification
- [ ] All 6 spaces endpoints respond correctly
- [ ] All 7 trust endpoints respond correctly
- [ ] Both preferences endpoints respond correctly
- [ ] DTOs match openapi-web.yaml schemas
- [ ] No regressions

## Dependencies
- Existing svc-tier DTOs and controller patterns
- remember-core SpaceService, GhostConfigHandlerService, PreferencesService

## Estimated Hours
3-4
