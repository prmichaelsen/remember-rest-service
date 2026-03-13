# Milestone 22: Trust Level OpenAPI Shape Alignment

## Goal
Resolve the shape mismatch between the OpenAPI spec's trust_level definition (float 0-1) and the REST service's current implementation (integer 1-5). Ensure the REST service DTOs match the spec exactly.

## Context
Task 41 migrated trust DTOs from float 0-1 to integer 1-5 (`@IsInt() @Min(1) @Max(5)`). However, both OpenAPI specs (openapi.yaml and openapi-web.yaml) still define trust_level as `number, minimum: 0, maximum: 1`.

This needs investigation: either the spec is outdated (remember-core actually uses 1-5 now) or the REST service migration was incorrect. The source of truth is the remember-core library's actual API — the spec should reflect that, and the REST service should match.

## Deliverables
1. Investigation: determine whether remember-core's actual trust_level uses 0-1 or 1-5
2. Align REST DTOs to match the correct shape
3. If spec is wrong, update spec in remember-core (cross-project)
4. Unit test updates if DTO validation changes

## Success Criteria
- [ ] trust_level shape in REST DTOs matches remember-core's actual API
- [ ] OpenAPI spec matches remember-core's actual API
- [ ] All trust-related tests pass

## Tasks
- Task 73: Investigate and Align Trust Level Shape

## Estimated Duration
0.5 weeks

## Dependencies
- None (independent of M21)
