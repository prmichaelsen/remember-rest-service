# Milestone 16: byDiscovery REST Endpoints

## Overview

Wire up remember-core's `byDiscovery` sort mode as REST endpoints in the service layer. This exposes the discovery interleaving algorithm (4:1 rated-to-unrated ratio) via two new POST endpoints for memories and spaces.

## Dependencies

- remember-core M25 (byDiscovery Sort Mode) — complete
- remember-core >= 0.34.16 published to npm

## Endpoints

| Method | Path | Core Method |
|--------|------|-------------|
| POST | `/api/svc/v1/memories/by-discovery` | `MemoryService.byDiscovery()` |
| POST | `/api/svc/v1/spaces/by-discovery` | `SpaceService.byDiscovery()` |

## Tasks

| ID | Name | Est. Hours |
|----|------|-----------|
| 54 | Bump remember-core to >= 0.34.16 | 0.25 |
| 55 | Memories byDiscovery endpoint | 0.5 |
| 56 | Spaces byDiscovery endpoint | 0.5 |
| 57 | Unit tests | 0.5 |

## Acceptance Criteria

- Both endpoints return interleaved results with `is_discovery` boolean on each memory
- DTOs validate input with class-validator decorators
- Follows existing sort-mode endpoint patterns (byTime, byDensity, byRating)
- TypeScript compiles cleanly
- Unit tests cover both endpoints
