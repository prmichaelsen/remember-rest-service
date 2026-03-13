# Task 69: Svc-Tier Missing Endpoints

## Objective
Add the 4 svc-tier routes present in openapi.yaml but missing from the REST service:
1. `POST /api/svc/v1/memories/{id}/click` — increment click engagement counter
2. `POST /api/svc/v1/memories/{id}/share` — increment share engagement counter
3. `POST /api/svc/v1/memories/{id}/comment-count` — increment comment engagement counter
4. `POST /api/svc/v1/spaces/by-recommendation` — personalized space feed by preference centroid

## Context
- Engagement counters are simple fire-and-forget endpoints returning 204
- spaces/by-recommendation follows the same pattern as existing by-discovery, by-curated sort modes
- OpenAPI spec references: openapi.yaml lines 403-447 (engagement), 1041-1062 (by-recommendation)
- Schemas: RecommendationSpaceInput, RecommendationSpaceResult

## Steps

### 1. Engagement Counter Endpoints on MemoriesController
- Add 3 new POST handlers to `src/memories/memories.controller.ts`
- Each takes `:id` path param, calls `memoryService.incrementClick()`, `.incrementShare()`, `.incrementCommentCount()` respectively
- All return 204 (no content) on success, 404 if memory not found
- Read remember-core MemoryService to confirm method names exist
- No request body needed

### 2. Spaces by-recommendation Endpoint
- Add `POST /by-recommendation` to `src/spaces/spaces.controller.ts`
- Create `RecommendationSpaceDto` in `src/spaces/spaces.dto.ts` matching RecommendationSpaceInput schema
- Calls `spaceService.byRecommendation(dto)` — confirm method exists in remember-core SpaceService
- Returns RecommendationSpaceResult shape

### 3. Verify shapes match OpenAPI spec
- Compare DTO fields against schema definitions in openapi.yaml
- Ensure response shapes match

## Verification
- [ ] 3 engagement counter endpoints return 204 on valid memory ID
- [ ] 3 engagement counter endpoints return 404 on invalid memory ID
- [ ] spaces/by-recommendation endpoint returns paginated results
- [ ] No regressions in existing tests

## Dependencies
- remember-core >= 0.68.0 (engagement methods + byRecommendation)

## Estimated Hours
1-2
