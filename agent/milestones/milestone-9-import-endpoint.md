# Milestone 9: Import Endpoint

**Goal**: Expose remember-core's ImportService via `POST /api/svc/v1/memories/import` for bulk text-to-memory imports
**Duration**: < 1 week
**Dependencies**: M3 (API Controllers)
**Status**: Not Started
**Blocked By**: remember-core `ImportService` implementation (not yet merged)

---

## Overview

This milestone adds the import endpoint to the REST service. remember-core's `ImportService` handles all business logic (chunking, batch memory creation, parent summary generation, relationship linking). This service's job is DTO validation, dependency wiring, and returning the result — following the same thin-adapter pattern as every other controller.

**Design Document**: [agent/design/local.import-endpoint.md](../design/local.import-endpoint.md)

---

## Deliverables

### 1. HaikuClient Provider
- `HAIKU_CLIENT` provider in CoreModule
- Configured from `ConfigService` (embeddings + AWS config)
- Globally injectable for future features (auto-tagging, dedup)

### 2. Import Endpoint
- `POST /api/svc/v1/memories/import` in MemoriesController
- `ImportItemDto` and `ImportMemoriesDto` with class-validator decorators
- `ImportService` wiring (MemoryService + RelationshipService + HaikuClient)
- Unit tests for DTO validation and controller action

---

## Success Criteria

- [ ] `POST /api/svc/v1/memories/import` returns 200 with `ImportResult` shape
- [ ] Empty items array returns 400
- [ ] Missing content field returns 400
- [ ] chunk_size out of range (< 500 or > 10000) returns 400
- [ ] Unauthenticated request returns 401
- [ ] HaikuClient provider constructs correctly from config
- [ ] All existing tests still pass
- [ ] New unit tests pass

---

## Tasks

1. [Task 30: Add HaikuClient Provider](../tasks/milestone-9-import-endpoint/task-30-add-haiku-client-provider.md) - CoreModule provider for HaikuClient
2. [Task 31: Add Import Endpoint](../tasks/milestone-9-import-endpoint/task-31-add-import-endpoint.md) - DTO, controller action, unit tests

---

## Testing Requirements

- [ ] HaikuClient provider unit test (construction with config)
- [ ] ImportItemDto validation tests
- [ ] ImportMemoriesDto validation tests (array min size, chunk_size bounds)
- [ ] Controller import() action unit test (mock ImportService)

---

**Next Milestone**: TBD
**Blockers**: remember-core `ImportService` must be implemented and published to npm
**Notes**: Estimated 2-3 hours total. Task 30 can be done ahead of the remember-core blocker since HaikuClient already exists.
