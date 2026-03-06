# Task 62: Add query field to byDiscovery DTOs

**Status**: Completed
**Estimated Time**: 0.5 hours
**Dependencies**: remember-core 0.35.4+ (query support added to DiscoveryModeRequest/DiscoverySpaceInput)

---

## Objective

Add optional `query` field to `DiscoveryModeDto` and `DiscoverySpaceDto` so the REST API passes search queries through to the core SDK's byDiscovery methods.

## Context

remember-core 0.35.4 added optional `query` field to `DiscoveryModeRequest` and `DiscoverySpaceInput`. When provided, both pools (rated + discovery) use hybrid search ranked by relevance instead of fetchObjects with rating/recency sort. The REST controllers already cast the full DTO to the core types (`dto as DiscoveryModeRequest`), so adding the field to the DTO is sufficient.

## Steps

1. Bump `@prmichaelsen/remember-core` to `^0.35.4`

2. Add `query` field to `DiscoveryModeDto` in `src/memories/memories.dto.ts`:
   ```typescript
   @IsOptional()
   @IsString()
   query?: string;
   ```

3. Add `query` field to `DiscoverySpaceDto` in `src/spaces/spaces.dto.ts`:
   ```typescript
   @IsOptional()
   @IsString()
   query?: string;
   ```

4. Verify build compiles and tests pass

## Verification

- [ ] `DiscoveryModeDto.query` optional string field added
- [ ] `DiscoverySpaceDto.query` optional string field added
- [ ] remember-core bumped to 0.35.4+
- [ ] Build compiles, tests pass
