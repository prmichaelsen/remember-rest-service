# Task 70: App-Tier Memory & Relationship Pass-Through

## Objective
Add the app-tier memory and relationship endpoints defined in openapi-web.yaml that are missing from the REST service.

## Missing Memory Endpoints (on AppMemoriesController)
1. `POST /api/app/v1/memories` — create memory
2. `PATCH /api/app/v1/memories/:memoryId` — update memory
3. `DELETE /api/app/v1/memories/:memoryId` — soft delete memory
4. `POST /api/app/v1/memories/search` — hybrid search
5. `POST /api/app/v1/memories/similar` — find similar
6. `POST /api/app/v1/memories/query` — semantic query
7. `GET /api/app/v1/memories/:memoryId/with-relationships` — compound endpoint (memory + relationship previews + optional similar)

## Missing Relationship Endpoints (new AppRelationshipsController or extend existing)
Existing controller only has `GET /:relationshipId/memories`. Add:
1. `POST /api/app/v1/relationships` — create relationship
2. `PATCH /api/app/v1/relationships/:relationshipId` — update relationship
3. `DELETE /api/app/v1/relationships/:relationshipId` — delete relationship
4. `POST /api/app/v1/relationships/search` — search relationships

## Context
- App-tier memory endpoints are pass-throughs using the same DTOs as svc-tier (CreateMemoryDto, UpdateMemoryDto, etc.)
- The `with-relationships` endpoint is a compound endpoint unique to app-tier — it resolves memory + relationships + optional similar in one call. Currently `GET /api/app/v1/memories/:memoryId` (getMemory) does something similar with query params. Evaluate whether to extend it or add the separate `/with-relationships` path per spec.
- App-tier relationship endpoints are pass-throughs using existing svc-tier DTOs
- openapi-web.yaml references: lines 219-360 (memories), 364-453 (relationships), 458-506 (with-relationships)

## Steps

### 1. Extend AppMemoriesController
- Add create, update, delete, search, similar, query handlers
- Reuse existing svc-tier DTOs (CreateMemoryDto, UpdateMemoryDto, SearchMemoryDto, etc.)
- Service instantiation follows same pattern as existing getMemory handler

### 2. Add with-relationships Compound Endpoint
- `GET /api/app/v1/memories/:memoryId/with-relationships`
- Query params: includeRelationships (bool, default true), relationshipMemoryLimit (int, default 5), includeSimilar (bool, default false), similarLimit (int, default 5)
- Returns MemoryWithRelationships shape from spec
- Evaluate overlap with existing getMemory endpoint — may need to reconcile

### 3. Extend AppRelationshipsController
- Add create, update, delete, search handlers to `src/app/relationships/app-relationships.controller.ts`
- Reuse existing svc-tier DTOs (CreateRelationshipDto, UpdateRelationshipDto, SearchRelationshipDto)

## Verification
- [ ] All 7 app-tier memory endpoints respond correctly
- [ ] All 4 app-tier relationship endpoints respond correctly
- [ ] with-relationships returns compound response with relationship previews
- [ ] DTOs match openapi-web.yaml schemas
- [ ] No regressions

## Dependencies
- Existing svc-tier DTOs and controller patterns
- remember-core MemoryService, RelationshipService

## Estimated Hours
3-4
