# Task 51: Controller Validation & Worker Wiring

**Milestone**: [M14 - File Extraction Integration](../../milestones/milestone-14-file-extraction-integration.md)
**Estimated Time**: 2-3 hours
**Dependencies**: task-49, task-50
**Status**: Not Started

---

## Objective

Add pre-import validation to the import endpoint, inject `ExtractorRegistry` into the controller, and pass it to `ImportJobWorker`. This is the main integration point.

---

## Steps

### 1. Inject ExtractorRegistry

In `MemoriesController`, inject the `EXTRACTOR_REGISTRY` provider:

```typescript
constructor(
  @Inject(EXTRACTOR_REGISTRY) private extractorRegistry: ExtractorRegistry,
  // ... existing injections
) {}
```

Update `MemoriesModule` to import from CoreModule if not already global.

### 2. Add Pre-Import Validation

Before job creation in `importMemories()`, validate items:

```typescript
import { validateImportItems } from '@prmichaelsen/remember-core/services';

// Before job creation
const errors = validateImportItems(dto.items, this.extractorRegistry);
if (errors.length > 0) {
  throw new BadRequestException({
    message: 'Invalid import items',
    errors: errors.map(e => ({ index: e.index, error: e.error })),
    supported_types: this.extractorRegistry.getSupportedMimeTypes(),
  });
}
```

This returns 400 **before** the 202 and job creation.

### 3. Pass ExtractorRegistry to Worker

Update the worker construction:

```typescript
const worker = new ImportJobWorker(
  this.jobService,
  memoryService,
  relationshipService,
  this.haikuClient,
  this.logger,
  this.extractorRegistry,  // NEW: 6th argument
);
```

### 4. Write Unit Tests

- Test: `file_url` + `mime_type` with supported type → 202 accepted
- Test: `file_url` + unsupported `mime_type` → 400 with error
- Test: `file_url` without `mime_type` → 400 with error
- Test: neither `content` nor `file_url` → 400 with error
- Test: `content`-only items → 202 (backward compatible)
- Test: mixed items (some content, some file_url) → 202
- Test: ExtractorRegistry passed to ImportJobWorker constructor

### 5. Update Existing Tests

Update `memories.controller.spec.ts` to:
- Provide mock `EXTRACTOR_REGISTRY` in test module
- Ensure existing import tests still pass with the new parameter

---

## Verification

- [ ] Pre-import validation returns 400 for invalid items
- [ ] Validation runs before job creation (no orphaned jobs)
- [ ] Error response includes supported MIME types for discoverability
- [ ] ExtractorRegistry injected and passed to worker
- [ ] Existing text-only import tests pass
- [ ] New validation tests pass
- [ ] Build passes
