# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
