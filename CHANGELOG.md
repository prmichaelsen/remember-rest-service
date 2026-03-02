# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
