# Milestone 6: Live E2E Testing

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M5 (Cloud Run Deployment)
**Tasks**: 4

---

## Goal

Create a live E2E test suite that generates real JWTs and calls the deployed e1 service endpoints over HTTPS. Unlike the existing `*.e2e.ts` tests (which use NestJS TestingModule with mocked providers), these tests exercise the full deployed stack: Cloud Run → NestJS → Weaviate/Firestore/Embeddings.

---

## Deliverables

1. **Test infrastructure**: Jest config, global setup/teardown (fetches JWT secret from Secret Manager), HTTP client helper, JWT helper
2. **Smoke & auth tests**: Health/version endpoints, JWT validation (missing/invalid/expired/wrong-audience)
3. **CRUD lifecycle tests**: Memories, relationships (full create → search → update → delete cycle)
4. **Service tests**: Preferences GET/PATCH, trust management lifecycle, spaces publish/search/retract

---

## Success Criteria

- [ ] `npm run test:live` runs all live tests against e1
- [ ] JWT generated from real Secret Manager token
- [ ] Full CRUD lifecycle tested for memories and relationships
- [ ] Preferences, trust, and spaces endpoints exercised
- [ ] Test data cleaned up after each suite
- [ ] Tests pass on healthy e1 deployment

---

## Architecture Notes

- Tests live in `test/live/` (separate from colocated src tests)
- Jest config: `jest-live.config.ts` with `maxWorkers: 1`, `testTimeout: 30000`
- Secret fetched via `gcloud secrets versions access` in globalSetup, written to temp file
- Unique test user ID per run (`live-test-<random>`) for data isolation
- Numeric file prefixes enforce execution order (01-health, 02-auth, etc.)

---

**Related**: [M4 - Observability & Testing](milestone-4-observability-testing.md), [M5 - Cloud Run Deployment](milestone-5-cloud-run-deployment.md)
