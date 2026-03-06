# Task 54: Bump remember-core to >= 0.34.16

**Milestone**: [M16 - byDiscovery REST Endpoints](../../milestones/milestone-16-by-discovery-rest.md)
**Estimated Time**: 0.25 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Update the remember-core dependency to >= 0.34.16, which exports `DiscoveryModeRequest`, `DiscoveryModeResult`, `DiscoverySpaceInput`, `DiscoverySpaceResult`, and the `byDiscovery()` methods on both `MemoryService` and `SpaceService`.

---

## Steps

### 1. Update package.json

```bash
npm install @prmichaelsen/remember-core@^0.34.16
```

### 2. Verify imports resolve

```typescript
import {
  DiscoveryModeRequest,
  DiscoveryModeResult,
  DiscoverySpaceInput,
  DiscoverySpaceResult,
} from '@prmichaelsen/remember-core/services';
```

### 3. Verify build

```bash
npx tsc --noEmit
```

---

## Verification

- [ ] `package.json` shows `@prmichaelsen/remember-core` >= 0.34.16
- [ ] All new types import cleanly
- [ ] `tsc --noEmit` passes
- [ ] Existing tests still pass

---

**Next Task**: [Task 55: Memories byDiscovery Endpoint](task-55-memories-by-discovery-endpoint.md)
