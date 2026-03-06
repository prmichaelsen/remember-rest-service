# Task 53: Investigate Content Moderation Service Unavailable

**Milestone**: [M15 - Bugfixes](../../milestones/milestone-15-bugfixes.md)
**Estimated Time**: 1-2 hours
**Dependencies**: Task 47 (Wire ModerationClient)
**Status**: Not Started

---

## Objective

Investigate and resolve "content moderation service unavailable" errors. Determine whether the issue is in the MODERATION_CLIENT provider configuration, Anthropic API key availability in deployed environments, or in how remember-core's moderation pipeline handles a null/unavailable client.

---

## Context

Task 47 wired `MODERATION_CLIENT` into `SpacesController` using `createModerationClient({ apiKey })` from remember-core. The provider returns `null` when `ANTHROPIC_API_KEY` is not set (see `core.providers.ts:85-88`). The SpacesController passes `this.moderationClient ?? undefined` to SpaceService's options.

Potential failure points:
1. **Missing ANTHROPIC_API_KEY in deployed environment** - Secret not configured in Cloud Run / Secret Manager
2. **remember-core SpaceService behavior when moderationClient is undefined** - May throw "service unavailable" instead of gracefully skipping moderation
3. **ProfilesController and ConfirmationsController don't pass moderationClient at all** - They construct SpaceService without the moderation options param, which may cause issues if remember-core now expects it

Key files:
- `src/core/core.providers.ts:82-90` - MODERATION_CLIENT provider (returns null if no API key)
- `src/spaces/spaces.controller.ts:41-49` - SpaceService construction with moderationClient
- `src/confirmations/confirmations.controller.ts:21-28` - SpaceService without moderationClient
- `src/app/profiles/profiles.controller.ts:47-59` - SpaceService without moderationClient

---

## Steps

### 1. Check Deployed Environment Configuration

Verify that ANTHROPIC_API_KEY is available in Cloud Run environments (e1 and production).

```bash
# Check Secret Manager for the key
gcloud secrets list --filter="name:ANTHROPIC"
gcloud secrets versions access latest --secret=ANTHROPIC_API_KEY 2>&1 | head -1
```

Check Cloud Run service configuration to confirm the secret is mounted.

### 2. Check remember-core Moderation Behavior

Review remember-core SpaceService to understand what happens when:
- `moderationClient` is `undefined` (not passed)
- `moderationClient` is `null`
- `moderationClient` is valid but API returns errors

Determine if there's a code path that throws "content moderation service unavailable".

### 3. Audit All SpaceService Construction Sites

Verify consistency across all controllers that instantiate SpaceService:
- `SpacesController.getService()` - passes moderationClient (good)
- `SpacesController.getPublicReadOnlyService()` - passes moderationClient (good)
- `ConfirmationsController.getService()` - does NOT pass moderationClient
- `ProfilesController.getSpaceService()` - does NOT pass moderationClient

Determine if the missing moderationClient in ConfirmationsController and ProfilesController is the root cause.

### 4. Apply Fix

Based on findings, apply the appropriate fix:
- If missing secret: Add ANTHROPIC_API_KEY to Cloud Run secret mounts
- If null handling issue: Update remember-core or add null guard in REST service
- If inconsistent construction: Wire MODERATION_CLIENT into ConfirmationsController and ProfilesController

### 5. Test

- Run existing unit tests to verify no regressions
- If code changes made, add targeted tests for the fix
- Verify locally that SpaceService works with null/undefined moderationClient

---

## Verification

- [ ] Root cause identified and documented
- [ ] Fix applied (code change, config change, or both)
- [ ] All existing tests pass (165+)
- [ ] New tests added if code was changed
- [ ] Verified in local environment
- [ ] Ready for redeployment

---

## Expected Output

Root cause documented and fix applied. All SpaceService construction sites consistent with respect to moderationClient handling.

---

## Common Issues and Solutions

### Issue 1: ANTHROPIC_API_KEY not in Secret Manager
**Symptom**: MODERATION_CLIENT provider returns null in deployed environment
**Solution**: Add secret via `gcloud secrets create ANTHROPIC_API_KEY --data-file=-`

### Issue 2: remember-core throws when moderationClient is undefined
**Symptom**: SpaceService.publish() or .revise() throws "service unavailable"
**Solution**: Either always pass moderationClient, or update remember-core to gracefully skip moderation

---

## Notes

- The MODERATION_CLIENT provider gracefully returns null when no API key is set
- SpacesController already handles null → undefined conversion
- ConfirmationsController and ProfilesController may need the same treatment
- This may also affect the app-tier ghost controller if it uses SpaceService
