# Task 41: Trust Level Integer Migration (1-5)

## Context

remember-core M19 migrated trust levels from float 0-1 to integer 1-5 (`TrustLevel` enum).
remember-rest-service depends on `@prmichaelsen/remember-core ^0.28.0` but has not updated
its NestJS DTOs or test mocks to match the new integer trust level range.

## Trust Level Mapping

| Old (float) | New (integer) | Label        |
|-------------|---------------|--------------|
| 0.0         | 1             | PUBLIC       |
| 0.25        | 2             | INTERNAL     |
| 0.5         | 3             | CONFIDENTIAL |
| 0.75        | 4             | RESTRICTED   |
| 1.0         | 5             | SECRET       |

## Changes Required

### 1. DTO Validation Updates (3 files)

**`src/trust/trust.dto.ts`**
- `SetTrustDto.trust_level`: `@Min(0) @Max(1)` -> `@Min(1) @Max(5)` + `@IsInt()`
- `UpdateGhostConfigDto.default_friend_trust`: same
- `UpdateGhostConfigDto.default_public_trust`: same

**`src/memories/memories.dto.ts`**
- `SearchMemoriesDto.trust_min`: `@Min(0) @Max(1)` -> `@Min(1) @Max(5)` + `@IsInt()`
- `SearchMemoriesDto.trust_max`: same
- `SearchMemoriesDto.accessor_trust_level`: same
- `CreateMemoryDto.trust`: same
- `UpdateMemoryDto.trust`: same

**`src/preferences/preferences.dto.ts`**
- `UpdatePreferencesDto.default_trust_level`: `@Min(0) @Max(1)` -> `@Min(1) @Max(5)` + `@IsInt()`

### 2. Test Mock Updates (3 files)

**`src/trust/trust.controller.spec.ts`**
- `trust_level: 0.75` -> `trust_level: 4`
- `per_user_trust` values: `0.75` -> `4`, `0.5` -> `3`
- `trust: 0.5` -> `trust: 3`
- `default_friend_trust: 0.25` -> `2`, `default_public_trust: 0` -> `1`

**`src/app/trust/ghost.controller.spec.ts`**
- `resolveAccessorTrustLevel` mock return: `0.5` -> `3`
- `DEFAULT_GHOST_CONFIG` mock: `default_friend_trust: 0.25` -> `2`, `default_public_trust: 0` -> `1`
- `per_user_trust` values: `0.5` -> `3`

**`src/memories/memories.controller.spec.ts`**
- `trust: 0.5` -> `trust: 3`

### 3. Bump remember-core

- Update `@prmichaelsen/remember-core` to latest version containing TrustLevel changes

## Verification

- [ ] All DTOs use `@Min(1) @Max(5)` + `@IsInt()` for trust fields
- [ ] All test mocks use integer trust values 1-5
- [ ] `npm test` passes with zero failures
- [ ] No remaining float trust references (grep for `0.5`, `0.75`, `0.25` in trust contexts)

## Estimated Hours

1-2

## Dependencies

- remember-core trust level migration (M19 task-98, task-99) must be published to npm
