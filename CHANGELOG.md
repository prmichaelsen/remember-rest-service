# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-03-07

### Added
- **Recommendation Sort Endpoint** — `POST /api/svc/v1/memories/by-recommendation`
  - Personalized memory feed sorted by similarity to user's preference centroid
  - Returns `similarity_pct`, `profileSize`, `insufficientData` flag, and optional `fallback_sort_mode`
- **Property Sort Endpoint** — `POST /api/svc/v1/memories/by-property`
  - Sort memories by any Weaviate property (e.g. `total_significance`, `feel_trauma`, `created_at`)
  - Required `sort_field` and `sort_direction` parameters
- **Broad Search Endpoint** — `POST /api/svc/v1/memories/by-broad`
  - Truncated content view (head/mid/tail slices) for scan-and-drill-in workflows
  - Supports optional `query` for hybrid search and `sort_order` for chronological ordering
- **Random Sampling Endpoint** — `POST /api/svc/v1/memories/by-random`
  - Random memory sampling for serendipitous rediscovery
  - Returns `total_pool_size` alongside sampled results
- 6 new unit tests (182 total passing, 2 pre-existing failures)

## [0.9.1] - 2026-03-06

### Fixed
- Wire `MemoryIndexService` into all `SpaceService` constructors (task-48)
- Spaces, confirmations, and profiles controllers now pass `memoryIndex` to SpaceService
- Published memory UUIDs are now indexed in Firestore, fixing 404s on `GET /memories/:id`
- Bump `@prmichaelsen/remember-core` to ^0.33.1

## [0.9.0] - 2026-03-05

### Changed
- **BREAKING**: Trust level validation migrated from float 0-1 to integer 1-5
  - All trust-related DTO fields now use `@IsInt() @Min(1) @Max(5)` instead of `@IsNumber() @Min(0) @Max(1)`
  - Affected DTOs: `SetUserTrustDto`, `UpdateGhostConfigDto`, `CreateMemoryDto`, `UpdateMemoryDto`, `SearchFiltersDto`, `GhostSearchContextDto`, `PrivacyPreferencesDto`
  - Aligns with remember-core M19 TrustLevel enum redesign (PUBLIC=1, INTERNAL=2, CONFIDENTIAL=3, RESTRICTED=4, SECRET=5)
- Updated test mocks to use integer trust values
- Bump `@prmichaelsen/remember-core` to ^0.29.0 (read-time trust normalization)

### Fixed
- `GET /memories/:id?include=similar` returning 500 Unauthorized — MemoryService was constructed with request userId ('anonymous' for unauthenticated) instead of the memory's actual owner, causing `findSimilar()` ownership check to fail

## [0.8.0] - 2026-03-05

### Added
- **MemoryIndexService provider** — singleton `MEMORY_INDEX` in CoreModule for Firestore UUID-to-collection lookup table
- All `MemoryService` constructors now pass `{ memoryIndex, weaviateClient }` options, enabling automatic index writes on memory creation

### Changed
- **AppMemoriesController** migrated from `MemoryResolutionService.resolve()` to `MemoryService.resolveById()` for O(1) cross-collection resolution via Firestore index
- Updated 5 controllers: MemoriesController, ProfilesController, GhostSearchController, AppRelationshipsController, AppMemoriesController

### Removed
- All references to `MemoryResolutionService` (replaced by `MemoryService.resolveById()`)

## [0.7.1] - 2026-03-05

### Fixed
- Cloud Run deploy failure — container crashed on startup due to missing `JobsModule` import in `MemoriesModule`
  - `MemoriesController` injects `JOB_SERVICE` (added in M11 for async import) but `MemoriesModule` did not import `JobsModule`
  - NestJS dependency injection failed at startup, preventing the container from listening on port 8080

## [0.7.0] - 2026-03-05

### Added
- **Job Tracking Endpoints** — async job lifecycle management
  - `GET /api/svc/v1/jobs/:id` — poll job status, progress, steps, and result
  - `POST /api/svc/v1/jobs/:id/cancel` — cancel a running job
  - `POST /api/svc/v1/jobs/cleanup` — remove expired jobs (admin/cron)
- **JobsModule** with `JOB_SERVICE` provider wrapping remember-core `JobService`
- **Async Import** — `POST /memories/import` now returns 202 with `{ job_id }` and `Location` header
  - Creates job via `JobService.create()`, dispatches `ImportJobWorker` in background
  - Worker handles chunking, step tracking, cancellation, and completion
- **MemoryResolutionService** — cross-collection fallback in app-tier memories endpoint
  - `GET /api/app/v1/memories/:id` now uses `MemoryResolutionService.resolve()` instead of raw `MemoryService.getById()`
  - Falls back across collections when primary lookup returns nothing
- 8 new unit tests for jobs (module + controller), 7 new e2e tests

### Changed
- Updated `@prmichaelsen/remember-core` from ^0.27.0 to ^0.27.3
- Import endpoint response changed from 200 with full result to 202 with `{ job_id }` (breaking for callers expecting synchronous result)

## [0.6.1] - 2026-03-04

### Fixed
- App memories endpoint response shape mismatch with SDK `RelationshipWithPreviews` contract
  - Rename `member_previews` → `memory_previews` to match SDK interface
  - Add missing `memory_count`, `strength`, `confidence`, `source` fields to relationship objects
  - Add missing `space_ids`, `group_ids` to `MemoryPreview` objects
  - Return structured relationship fields instead of raw spread

## [0.6.0] - 2026-03-04

### Added
- **App-Tier Memory Endpoint** — `GET /api/app/v1/memories/:memoryId`
  - Returns memory with optional relationship compound response
  - Query params: `includeRelationships` (boolean), `relationshipMemoryLimit` (1-10, default 5)
  - Builds `MemoryPreview` objects with title fallback (content[:80]) and author_id fallback
  - Sorts member previews alphabetically by title
- **App-Tier Relationship Memories Endpoint** — `GET /api/app/v1/relationships/:relationshipId/memories`
  - Paginated memory listing for a relationship
  - Query params: `limit` (1-50, default 20), `offset` (min 0, default 0)
  - Filters soft-deleted memories, sorts alphabetically by title
  - Returns relationship metadata, memories, total count, and has_more flag
- Validation DTOs: `GetMemoryQueryDto`, `GetRelationshipMemoriesQueryDto`
- 10 unit tests for both new controllers

## [0.5.0] - 2026-03-04

### Added
- **Import Endpoint** — `POST /api/svc/v1/memories/import`
  - Bulk memory import with token-count chunking via remember-core `ImportService`
  - `ImportMemoriesDto` validation: required `items` array (min 1), optional `chunk_size` (500–10000) and `context_conversation_id`
  - `ImportItemDto`: required `content`, optional `source_filename`
  - Constructs `ImportService` with `MemoryService`, `RelationshipService`, `HaikuClient`, and logger per request
  - Returns `ImportResult` with parent/chunk memory IDs, counts, and generated summaries
- **HAIKU_CLIENT Provider** — Anthropic API integration for import summarization
  - `AnthropicConfig` in config types/service (`ANTHROPIC_API_KEY`, `ANTHROPIC_HAIKU_MODEL`)
  - `createHaikuClient` factory from remember-core; returns `null` when API key not configured
  - Registered in `CoreModule`, exported via barrel
  - 3 unit tests for provider (with key, default model, null when missing)
- 3 unit tests for import endpoint (construct + call, passthrough result, throw when no haiku client)

### Changed
- Updated `@prmichaelsen/remember-core` from v0.24.2 to v0.25.0

## [0.4.1] - 2026-03-04

### Changed
- Enable gzip response compression via `compression` middleware
- Raise default rate limit from 100 to 1000 requests/hour (`RATE_LIMIT_MAX`)

## [0.4.0] - 2026-03-03

### Added
- **Time-Slice Search Endpoint** — `POST /api/svc/v1/memories/by-time-slice`
  - Combines text search with chronological ordering via 14 parallel time-bucketed Weaviate queries
  - Calls `searchByTimeSlice(memoryService, query, options)` from remember-core server-side
  - TimeSliceModeDto validation: required `query`, optional limit/offset/direction/filters
- **Density-Slice Search Endpoint** — `POST /api/svc/v1/memories/by-density-slice`
  - Combines text search with relationship-density ordering via 9 parallel Weaviate queries
  - Calls `searchByDensitySlice(memoryService, query, options)` from remember-core server-side
  - DensitySliceModeDto validation: required `query`, optional limit/offset/direction/filters
- Jest moduleNameMapper for `@prmichaelsen/remember-core/search` subpath
- Integration pattern doc: `agent/patterns/local.svc-client-by-time-slice.md`

### Changed
- Updated `@prmichaelsen/remember-core` from v0.22.8 to v0.24.0

## [0.3.1] - 2026-03-03

### Fixed
- Ghost config PATCH endpoint silently dropping `per_user_trust` and `blocked_users` fields
  - Add missing fields to `UpdateGhostConfigDto` so NestJS whitelist no longer strips them
  - Remove unsafe `as any` cast in trust controller, replaced with typed `Partial<GhostConfig>`
- 3 new unit tests for ghost config partial update behavior (117 total passing)

## [0.3.0] - 2026-03-03

### Added
- **Sort Mode REST Endpoints** - Expose Time and Density sort modes from remember-core
  - `POST /api/svc/v1/memories/by-time` — Chronological sorting by created_at (asc/desc)
  - `POST /api/svc/v1/memories/by-density` — Sort by relationship count (highest first)
  - TimeModeDto and DensityModeDto validation with class-validator
  - Support for pagination (limit/offset), filters, and ghost context
  - Server-side sorting via remember-core v0.22.5 MemoryService
- **Jest Configuration** - Added moduleNameMapper for `@prmichaelsen/remember-core/collections`

### Changed
- Updated `@prmichaelsen/remember-core` from v0.19.2 to v0.22.5
- Phase 1 MVP Complete: Smart (search), Time, and Density sort modes now available via REST

Completed Task 1: Add Sort Mode REST Endpoints
Milestone: M3 - Sort Mode Endpoints (1/1 tasks, 100%)
Version: 0.2.1 → 0.3.0

## [0.2.1] - 2026-03-02

### Fixed
- Log level in production was hardcoded to `warn`, suppressing all request logs
- Add `LOG_LEVEL` env var support (accepts `debug`, `info`, `warn`, `error`; defaults to `info`)

## [0.2.0] - 2026-02-28

### Added
- App tier routes (`/api/app/v1/`) matching remember-core app client SDK
- ProfilesController with 4 compound endpoints:
  - `POST /api/app/v1/profiles` — create profile memory and publish to profiles space
  - `PATCH /api/app/v1/profiles/:memoryId` — update memory and republish
  - `DELETE /api/app/v1/profiles/:memoryId` — retract from profiles space
  - `POST /api/app/v1/profiles/search` — search profiles with enriched results
- GhostSearchController with 1 compound endpoint:
  - `POST /api/app/v1/trust/search-as-ghost` — resolve trust, search owner memories, redact
- AppTierModule registered in root module
- Validation DTOs for all app tier request bodies
- 14 unit tests for app tier controllers

## [0.1.0] - 2026-02-28

### Added
- Initial release with NestJS on Google Cloud Run
- SVC tier routes (`/api/svc/v1/`) — 27 endpoints across 6 controllers
- JWT authentication with platform service token
- Rate limiting and CORS configuration
- Health and version endpoints
- Logging interceptor with structured output
- Error filter for AppError and fallback handling
- Dockerfile and Cloud Build configuration
- Live E2E test suite (32 tests across 7 suites)
- Auto-provisioning with safeEnsureUserCollection
