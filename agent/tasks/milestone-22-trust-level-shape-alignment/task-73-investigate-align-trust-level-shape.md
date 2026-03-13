# Task 73: Investigate and Align Trust Level Shape

## Objective
Resolve the mismatch between the OpenAPI spec's trust_level definition (float 0-1) and the REST service's current DTOs (integer 1-5). Ensure all three artifacts agree: remember-core library, OpenAPI spec, REST service DTOs.

## Context
- Task 41 migrated REST DTOs from float 0-1 to integer 1-5 (`@IsInt() @Min(1) @Max(5)`)
- Both openapi.yaml and openapi-web.yaml still define trust_level as `number, minimum: 0, maximum: 1`
- Affected endpoints: set-user-trust (svc + app), ghost-config update, SearchFilters.trust_min/trust_max
- Affected DTOs: trust.dto.ts, memories.dto.ts, preferences.dto.ts
- 3 test files were updated in task 41 to use integer values

## Steps

### 1. Investigate remember-core's actual trust_level type
- Read remember-core GhostConfigHandlerService — what type does setUserTrust() accept?
- Read remember-core TrustLevel type definition
- Check if remember-core M-something migrated trust to 1-5 or if it still uses 0-1
- Check what SearchFilters.trust_min/trust_max expect in remember-core

### 2. Determine source of truth
- If remember-core uses 1-5: REST service is correct, specs need updating (cross-project task in remember-core)
- If remember-core uses 0-1: REST service DTOs need reverting to float 0-1 (undo task 41)
- If remember-core accepts both: document and pick one

### 3. Align REST DTOs
- Update DTOs to match the determined source of truth
- Update class-validator decorators accordingly
- Update test fixtures to match

### 4. Cross-project spec update (if needed)
- If spec is wrong, note that openapi.yaml and openapi-web.yaml in remember-core need trust_level updated
- Create a note/issue for the remember-core project

## Verification
- [ ] trust_level in REST DTOs matches remember-core's actual API
- [ ] All trust-related unit tests pass
- [ ] SearchFilters trust_min/trust_max validated correctly
- [ ] Cross-project spec update tracked if needed

## Dependencies
- None (independent investigation)

## Estimated Hours
1-2
