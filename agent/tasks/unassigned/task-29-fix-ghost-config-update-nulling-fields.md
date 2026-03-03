# Task 29: Fix Ghost Config Update Nulling Fields

**Milestone**: Unassigned
**Estimated Time**: 2-3 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Investigate and fix the bug where updating ghost config via `PATCH /api/svc/v1/trust/ghost-config` sets some fields to `true` and nulls out the rest, instead of performing a proper partial update.

---

## Context

When a client sends a ghost config update (e.g. toggling `enabled`), the response and/or stored document ends up with unexpected values — some fields become `true` and others become `null`. This may be caused by:

1. **Missing DTO fields** — The `UpdateGhostConfigDto` only declares 5 of the 7 `GhostConfig` fields. It's missing `per_user_trust` (Record) and `blocked_users` (string[]).
2. **NestJS `whitelist: true`** stripping unlisted properties from the request body before the controller sees them.
3. **The `as any` cast** on line 53 of `trust.controller.ts` hiding type mismatches.
4. **Client-side full-object replace** — the client may be sending a full `GhostConfig` object (including fields it doesn't intend to change), and the stripped DTO causes unintended writes.

The remember-core side is correct: `setGhostConfigFields` uses Firestore `mergeFields: Object.keys(config)` which only writes keys present in the update object. `getGhostConfig` merges stored doc with `DEFAULT_GHOST_CONFIG`. So the issue is in the REST service DTO and/or the calling client.

---

## Steps

### 1. Confirm the Bug

- Call `GET /api/svc/v1/trust/ghost-config` and record current state
- Call `PATCH /api/svc/v1/trust/ghost-config` with a partial update (e.g. `{ "enabled": true }`)
- Call `GET /api/svc/v1/trust/ghost-config` and verify which fields changed
- Check if fields not in the update were nulled or reset

### 2. Add Missing Fields to UpdateGhostConfigDto

Update `src/trust/trust.dto.ts` to include all `GhostConfig` fields:

```typescript
import { IsObject, IsArray } from 'class-validator';

export class UpdateGhostConfigDto {
  // ... existing 5 fields ...

  @IsOptional()
  @IsObject()
  per_user_trust?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blocked_users?: string[];
}
```

### 3. Remove the `as any` Cast

In `src/trust/trust.controller.ts` line 53, remove the unsafe cast:

```typescript
// Before
return handleUpdateConfig(userId, dto as any, this.logger);

// After
return handleUpdateConfig(userId, dto, this.logger);
```

Ensure `UpdateGhostConfigDto` satisfies `Partial<GhostConfig>` so this compiles.

### 4. Investigate Client-Side Behavior

Check whether the calling client (agentbase.me) is:
- Sending a full `GhostConfig` object (which gets stripped by whitelist)
- Sending only changed fields (correct for PATCH)
- Accidentally sending `undefined` values that Firestore interprets as `null`

### 5. Add Unit Tests

- Test that PATCH with `{ enabled: true }` preserves other fields
- Test that `per_user_trust` and `blocked_users` pass through DTO validation
- Test that omitted fields are not included in the DTO object sent to handler

### 6. Verify Fix

- Repeat step 1 confirmation flow
- All unmodified fields should retain their previous values

---

## Verification

- [ ] `UpdateGhostConfigDto` includes all 7 `GhostConfig` fields
- [ ] `as any` cast removed from trust controller
- [ ] Partial update only writes specified fields (verified via GET before/after)
- [ ] `per_user_trust` and `blocked_users` can be sent through the API
- [ ] Existing unit tests still pass
- [ ] New unit tests added for partial update behavior

---

## Key Files

- `src/trust/trust.dto.ts` — DTO missing fields
- `src/trust/trust.controller.ts:53` — `as any` cast
- `src/main.ts:30-35` — ValidationPipe config (`whitelist: true`)
- remember-core `src/services/ghost-config-handler.service.ts` — `handleUpdateConfig`
- remember-core `src/services/ghost-config.service.ts` — `setGhostConfigFields` (Firestore merge)
- remember-core `src/types/ghost-config.types.ts` — `GhostConfig` type (7 fields)

---

## Notes

- The Firestore side (`mergeFields`) is correct — it only writes keys present in the update
- The real issue is that the NestJS DTO + whitelist strips fields the client sends
- The `as any` cast hides the mismatch between DTO (5 fields) and `Partial<GhostConfig>` (7 fields)
- Client-side investigation may also reveal issues — check if the client is doing read-modify-write vs. sending only deltas

---

**Related Design Docs**: agent/design/local.rest-api-architecture.md
**Estimated Completion Date**: TBD
