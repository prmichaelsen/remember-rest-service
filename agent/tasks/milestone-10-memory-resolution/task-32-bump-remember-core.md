# Task 32: Bump remember-core to v0.26.1

**Milestone**: [M10 - Memory Resolution Fallback](../../milestones/milestone-10-memory-resolution.md)
**Estimated Time**: 0.5 hours
**Dependencies**: remember-core v0.26.1 published to npm
**Status**: Not Started

---

## Objective

Update remember-core dependency to v0.26.1 which includes `MemoryResolutionService` and the `ImportService` barrel export (resolving M9 Task 31 `@ts-ignore`).

---

## Context

remember-core v0.26.1 adds:
- `MemoryResolutionService` — cross-collection memory lookup with fallback (needed for Task 33)
- `ImportService` barrel export — resolves the `@ts-ignore` in Task 31's import endpoint

---

## Steps

### 1. Update dependency

```bash
npm install @prmichaelsen/remember-core@^0.26.1
```

### 2. Remove @ts-ignore from import endpoint

In `src/memories/memories.controller.ts`, the dynamic import of ImportService can be replaced with a direct import from the barrel export now.

### 3. Verify build

```bash
npm run build
npm run test
```

---

## Verification

- [ ] `package.json` shows `@prmichaelsen/remember-core` >= 0.26.1
- [ ] `MemoryResolutionService` importable from `@prmichaelsen/remember-core/services`
- [ ] `ImportService` importable without `@ts-ignore`
- [ ] TypeScript builds cleanly
- [ ] All existing tests pass
