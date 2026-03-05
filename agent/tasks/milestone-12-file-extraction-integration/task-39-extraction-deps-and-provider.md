# Task 39: Extraction Dependencies & Provider

**Milestone**: [M12 - File Extraction Integration](../../milestones/milestone-12-file-extraction-integration.md)
**Estimated Time**: 1-2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Install extraction peer dependencies, create an `EXTRACTOR_REGISTRY` NestJS provider in CoreModule, and optionally wire VisionClient/DocumentAiClient from environment config.

---

## Steps

### 1. Install Dependencies

```bash
npm install unpdf mammoth turndown @types/turndown
```

These are peer deps in remember-core but real deps here (we're the consumer).

### 2. Add Config Properties

In `src/config/config.service.ts`, add optional extraction config:

```typescript
get extractionConfig() {
  return {
    // Google Vision API for image OCR (optional)
    visionApiEnabled: !!process.env.GOOGLE_VISION_API_KEY || !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // Google Document AI for scanned PDF OCR (optional)
    documentAiEnabled: !!process.env.DOCUMENT_AI_PROCESSOR_ID,
    documentAiProcessorId: process.env.DOCUMENT_AI_PROCESSOR_ID || '',
    documentAiLocation: process.env.DOCUMENT_AI_LOCATION || 'us',
  };
}
```

### 3. Create ExtractorRegistry Provider

In `src/core/core.providers.ts`, add:

```typescript
import { createDefaultRegistry } from '@prmichaelsen/remember-core/services';

export const EXTRACTOR_REGISTRY = Symbol('EXTRACTOR_REGISTRY');

export const extractorRegistryProvider = {
  provide: EXTRACTOR_REGISTRY,
  useFactory: () => {
    // For MVP: no cloud clients — plaintext, HTML, PDF (text-layer), DOCX only
    // VisionClient and DocumentAiClient can be added later when GCP APIs are configured
    return createDefaultRegistry();
  },
};
```

### 4. Export from CoreModule

Add `EXTRACTOR_REGISTRY` to CoreModule's providers and exports arrays.

### 5. Write Unit Test

- Verify `EXTRACTOR_REGISTRY` provider creates a registry with expected MIME types
- Verify registry supports at minimum: text/plain, text/html, application/pdf, DOCX MIME type

---

## Verification

- [ ] `unpdf`, `mammoth`, `turndown` installed as dependencies
- [ ] `EXTRACTOR_REGISTRY` provider registered in CoreModule
- [ ] Provider creates registry with plaintext, HTML, PDF, DOCX extractors
- [ ] Build passes
- [ ] Existing tests pass
