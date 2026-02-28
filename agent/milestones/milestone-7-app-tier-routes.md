# Milestone 7: App Tier Routes

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M3 (API Controllers)

---

## Goal

Implement the `/api/app/v1/` routes matching the remember-core app client SDK (`@prmichaelsen/remember-core/app`). These are use-case-oriented compound endpoints that collapse multi-step service operations into single REST calls.

---

## Background

The remember-core project defines two client SDK tiers:

1. **SVC Tier** (`/api/svc/v1/`) — Fine-grained service operations (already implemented, 27 endpoints)
2. **APP Tier** (`/api/app/v1/`) — Compound operations for app-level use cases (this milestone)

The app SDK (`AppClient`) exposes two resources:
- **ProfilesResource** — Profile lifecycle (create+publish, update+republish, retract, search)
- **GhostResource** — Trust-aware search (resolve trust server-side, search, redact)

---

## Deliverables

1. **ProfilesController** — 4 compound endpoints under `/api/app/v1/profiles`
2. **GhostController** — 1 compound endpoint under `/api/app/v1/trust`
3. **AppModule** — NestJS module registering app tier controllers
4. **Unit tests** — Colocated spec files for both controllers
5. **DTOs** — Validation classes for request bodies

---

## Endpoints

| Method | Path | SDK Method | Compound Logic |
|--------|------|------------|----------------|
| POST | `/api/app/v1/profiles` | `createAndPublish` | Create memory + publish to profiles space |
| PATCH | `/api/app/v1/profiles/:memoryId` | `updateAndRepublish` | Update memory + republish |
| DELETE | `/api/app/v1/profiles/:memoryId` | `retract` | Retract from profiles space |
| POST | `/api/app/v1/profiles/search` | `search` | Search profiles space + enrich results |
| POST | `/api/app/v1/trust/search-as-ghost` | `searchAsGhost` | Resolve trust + search + redact |

---

## Success Criteria

- [ ] All 5 app tier endpoints implemented and responding
- [ ] Compound operations correctly chain underlying service calls
- [ ] JWT auth required on all endpoints
- [ ] Unit tests pass for both controllers
- [ ] All existing tests continue to pass (no regressions)
- [ ] remember-core app client SDK can call all 5 endpoints

---

## Tasks

| ID | Name | Est. Hours | Status |
|----|------|-----------|--------|
| 27 | Implement App Tier Routes | 6-8 | Not Started |

---

## Resources

- OpenAPI Spec: `remember-core/docs/openapi-web.yaml`
- App Client SDK: `remember-core/src/app/`
- Existing SVC Controllers: `src/memories/`, `src/spaces/`, `src/trust/`
