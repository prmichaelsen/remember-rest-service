# Task 52: E2E Smoke Test

**Milestone**: [M14 - File Extraction Integration](../../milestones/milestone-14-file-extraction-integration.md)
**Estimated Time**: 1 hour
**Dependencies**: task-51
**Status**: Not Started

---

## Objective

Add an e2e test that validates the full file import flow: POST with `file_url` → 202 → poll job → completed. Also verify validation error responses.

---

## Steps

### 1. Add Validation E2E Tests

In the memories e2e test file:

- POST import with `file_url` but no `mime_type` → 400
- POST import with unsupported `mime_type` → 400 with `supported_types` in body
- POST import with neither `content` nor `file_url` → 400

### 2. Add Smoke Test for File Import (Optional)

If a test file URL is available (or mockable):
- POST import with `file_url` + `mime_type: text/plain` → 202
- Poll job until completed
- Verify memories created

Note: This may require a real signed URL or test fixture. If not practical, a unit test with mocked `downloadFile` is sufficient (already covered by remember-core tests).

### 3. Verify Backward Compatibility

- Existing text-only import e2e test still passes
- Job polling still works

---

## Verification

- [ ] Validation error e2e tests pass
- [ ] Existing import e2e tests pass
- [ ] Build passes
- [ ] All tests pass (unit + e2e)
