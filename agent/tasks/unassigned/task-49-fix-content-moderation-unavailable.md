# Task 49: Fix Content Moderation Unavailable in E1 (Recurrence)

**Milestone**: [M15 - Bugfixes](../../milestones/milestone-15-bugfixes.md)
**Estimated Time**: 1-2 hours
**Dependencies**: Task 53 (previous investigation, marked completed)
**Status**: Not Started

---

## Objective

Investigate and fix why the content moderation service returns "Content moderation unavailable. Please try again later." on the e1 environment, blocking all space publish/revise operations.

---

## Context

The `ANTHROPIC_API_KEY` secret (`remember-anthropic-api-key`) exists in GCP Secret Manager and is mapped to the e1 Cloud Run service. Both prod and e1 share the same secret name. However, when calling the Anthropic Messages API, the response is non-200, causing `createModerationClient` in `@prmichaelsen/remember-core` to fail-closed with the generic "unavailable" message.

The moderation service uses `claude-haiku-4-5-20251001` via direct HTTP to `https://api.anthropic.com/v1/messages`.

### Observed Error

```
AppError [validation]: Content moderation unavailable. Please try again later.
context: { fields: { moderation: ['blocked'] } }
```

This occurs on every space publish attempt against e1.

### Root Cause Candidates

1. **API key invalid/expired** — The key (`sk-ant-api03-...`) may be revoked or expired
2. **Billing issue** — Anthropic account may have billing problems
3. **Model access** — `claude-haiku-4-5-20251001` may not be available on this API key
4. **Rate limiting** — Unlikely for a fresh deploy, but possible
5. **Network** — Cloud Run may not be able to reach `api.anthropic.com` (unlikely, no egress restrictions)

### Logging Gap

The moderation service in `remember-core/src/services/moderation.service.ts` (lines 130-132) does NOT log the actual HTTP status or response body when the API call fails. It just returns `{ pass: false, reason: 'Content moderation unavailable...' }`. This makes debugging impossible from server logs alone.

---

## Steps

### 1. Verify the API key works

```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(gcloud secrets versions access latest --secret=remember-anthropic-api-key --project=com-f5-parm)" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"Say hi"}]}'
```

If this returns a non-200, the key is the problem. Generate a new key from console.anthropic.com and update the secret.

### 2. If key is valid, add diagnostic logging to moderation service

In `remember-core/src/services/moderation.service.ts`, add logging when the API returns non-200:

```typescript
if (!response.ok) {
  const errorBody = await response.text().catch(() => '');
  console.error(`Moderation API error: ${response.status} ${response.statusText}`, errorBody);
  return { pass: false, reason: 'Content moderation unavailable. Please try again later.' };
}
```

Publish a new remember-core version and redeploy e1.

### 3. If key is the problem, rotate it

```bash
echo -n "sk-ant-NEW-KEY" | gcloud secrets versions add remember-anthropic-api-key --data-file=- --project=com-f5-parm
```

Then redeploy e1 (or trigger a new Cloud Build).

### 4. Verify fix

Run the live e2e tests from remember-core:

```bash
cd ~/.acp/projects/remember-core && npm run test:live
```

The `05-spaces.live.ts` publish test should no longer return a 400 moderation error.

---

## Verification

- [ ] Root cause identified (key issue, model issue, or other)
- [ ] Content moderation API call succeeds (curl test)
- [ ] Space publish works on e1 (no moderation error)
- [ ] Diagnostic logging added to moderation service for future debugging
- [ ] Live e2e tests pass without moderation warnings
