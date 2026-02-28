# Task 22: Live Test Infrastructure

**Milestone**: [M6 - Live E2E Testing](../../milestones/milestone-6-live-e2e-testing.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 20
**Status**: Not Started

---

## Objective

Create the test infrastructure for live E2E tests: Jest config, global setup/teardown, HTTP client helper, JWT helper, and test ID generation.

---

## Steps

### 1. Create `jest-live.config.ts`

- `rootDir: 'test/live'`
- `testRegex: '.*\\.live\\.ts$'`
- `maxWorkers: 1` (serial execution, tests share state)
- `testTimeout: 30000` (Cloud Run cold start tolerance)
- `globalSetup` / `globalTeardown` pointing to setup scripts
- ESM support matching existing jest configs
- Simplified moduleNameMapper (no remember-core imports)

### 2. Create `test/live/setup/global-setup.ts`

- Verify `gcloud` CLI is available
- Fetch JWT secret: `gcloud secrets versions access latest --secret=remember-e1-platform-service-token --project=com-f5-parm`
- Write to `os.tmpdir() + '/.remember-live-test-secret'` (mode 0o600)
- Health check against e1 URL to warm the instance

### 3. Create `test/live/setup/global-teardown.ts`

- Delete temp secret file

### 4. Create `test/live/helpers/jwt.ts`

- `makeToken(sub)` — signs JWT with real secret (iss=agentbase.me, aud=svc, exp=1h)
- `makeExpiredToken(sub)` — expired JWT
- `makeWrongAudienceToken(sub)` — wrong audience
- Handle ESM import quirk: `const jwt = (jsonwebtoken as any).default ?? jsonwebtoken`

### 5. Create `test/live/helpers/http-client.ts`

- Base URL: `https://remember-rest-service-e1-dit6gawkbq-uc.a.run.app`
- `get(path, token?)`, `post(path, body, token?)`, `patch(path, body, token?)`, `del(path, body?, token?)`
- Returns `{ status, body, headers }`

### 6. Create `test/live/helpers/test-ids.ts`

- `TEST_USER_ID = 'live-test-<random-8>'` (unique per run)
- `TEST_TARGET_USER_ID` for trust tests

### 7. Add npm script

- `"test:live": "jest --config jest-live.config.ts"` in package.json

---

## Verification

- [ ] `npm run test:live` runs without errors (even if no test suites exist yet)
- [ ] globalSetup fetches secret and writes temp file
- [ ] globalTeardown cleans up temp file

---

**Next Task**: [Task 23: Smoke & Auth Live Tests](task-23-smoke-auth-live-tests.md)
