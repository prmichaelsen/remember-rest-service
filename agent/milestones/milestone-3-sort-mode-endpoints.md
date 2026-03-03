# Milestone 3: Sort Mode Endpoints

**Status**: Not Started
**Started**: TBD
**Target Completion**: 1 week
**Progress**: 0%

---

## Objective

Add REST API endpoints to expose remember-core's new sort mode methods (byTime, byDensity). Enable clients to use Time and Density sorting in addition to the existing Smart mode (hybrid search).

**Dependency**: remember-core M11 (Basic Sort Modes) must be completed first.

---

## Scope

### In Scope
- ✅ POST /memories/by-time endpoint
- ✅ POST /memories/by-density endpoint
- ✅ Request validation (Zod schemas)
- ✅ Authentication/authorization
- ✅ Error handling
- ✅ OpenAPI spec updates (if exists)

### Out of Scope
- ⏭️ Smart mode endpoint (already exists via POST /memories/search)
- ⏭️ Dynamic mode (REM curated feeds - Phase 2)
- ⏭️ Quality mode (RAG-optimized - Phase 2)
- ⏭️ Frontend UI changes (different repository)

---

## Success Criteria

- [ ] POST /memories/by-time endpoint works
- [ ] POST /memories/by-density endpoint works
- [ ] Both endpoints accept request body with pagination/filters
- [ ] Authentication enforced
- [ ] Input validation with clear error messages
- [ ] Consistent response format
- [ ] Integration tests pass
- [ ] OpenAPI spec updated (if exists)

---

## Tasks

1. **Task 1**: Add POST /memories/by-time endpoint (1 hour)
2. **Task 2**: Add POST /memories/by-density endpoint (1 hour)

**Total Estimated Time**: ~2 hours

---

## Dependencies

**Upstream**:
- remember-core M11 - Must be completed (Tasks 36-40)
- remember-core published to npm with new methods

**Downstream**:
- Frontend can consume new endpoints for sort mode UI

---

## Notes

- Smart mode already works via existing /memories/search endpoint
- Keep response format consistent with existing endpoints
- Use same authentication middleware as other endpoints
- Follow existing error handling patterns

---

**Milestone ID**: M3
**Created**: 2026-03-03
**Owner**: remember-rest-service team
