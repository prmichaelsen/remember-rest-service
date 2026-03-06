# Milestone 14: File Extraction Integration

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M11 (Job Tracking), remember-core M17 (File Format Extraction)

---

## Goal

Wire remember-core's file extraction pipeline into the REST import endpoint so consumers can POST file URLs (signed HTTPS) instead of raw text. The REST service handles DTO validation, pre-import MIME type checking, ExtractorRegistry creation, and passes it to ImportJobWorker which runs in-process via the existing `setImmediate()` pattern.

---

## Deliverables

### 1. Updated Import DTO
- `ImportItemDto` accepts optional `file_url` and `mime_type` fields
- `content` becomes optional (one of `content` or `file_url` required)
- class-validator decorators enforce mutual exclusivity and MIME type presence

### 2. ExtractorRegistry Provider
- New NestJS provider (`EXTRACTOR_REGISTRY`) in CoreModule
- Creates `ExtractorRegistry` via `createDefaultRegistry()` from remember-core
- Optionally injects `VisionClient` and `DocumentAiClient` if GCP credentials configured

### 3. Pre-Import Validation
- Controller calls `validateImportItems()` before job creation
- Returns 400 with validation errors for bad input (missing content/file_url, unsupported MIME type, missing mime_type)
- Runs before the 202 response

### 4. Worker Wiring
- Pass `ExtractorRegistry` as 6th argument to `ImportJobWorker` constructor
- Extraction happens in-process during `setImmediate()` execution
- No architectural changes to job flow

### 5. Peer Dependency Installation
- Install `unpdf`, `mammoth`, `turndown`, `@types/turndown` as dependencies
- These are peer deps in remember-core but real deps in the REST service (the consumer)

---

## Success Criteria

- [ ] `POST /api/svc/v1/memories/import` accepts `file_url` + `mime_type` items
- [ ] Pre-import validation returns 400 for invalid items before creating job
- [ ] Existing text-only imports still work (backward compatible)
- [ ] ExtractorRegistry available with plaintext, HTML, PDF, DOCX extractors
- [ ] Image extraction available when Vision API credentials configured
- [ ] Document AI fallback available when configured
- [ ] All existing tests pass
- [ ] New unit tests for DTO validation, provider creation, controller changes
- [ ] Build passes, typecheck passes

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Extraction timeouts on large files | Job hangs | Cloud Run timeout is 60 min, extraction is fast (seconds) |
| Memory pressure from large files | OOM | Files are transient (download, extract, discard). Largest concern is PDF — unpdf streams pages |
| Missing GCP credentials for OCR | Image/scanned PDF extraction unavailable | Graceful degradation — only register extractors when clients available |

---

## Related

- remember-core M17: `agent/design/local.file-format-extraction.md`
- remember-core extractors: `src/services/extractors/`
- Current import endpoint: `src/memories/memories.controller.ts:195-236`
