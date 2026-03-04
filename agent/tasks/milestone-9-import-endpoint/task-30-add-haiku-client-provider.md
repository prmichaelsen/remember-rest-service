# Task 30: Add HaikuClient Provider

**Milestone**: [M9 - Import Endpoint](../../milestones/milestone-9-import-endpoint.md)
**Estimated Time**: 0.5 hours
**Dependencies**: None (HaikuClient already exists in remember-core)
**Status**: Not Started

---

## Objective

Add a global `HAIKU_CLIENT` provider to `CoreModule` so that `HaikuClient` from remember-core is injectable across the application. This is needed by the import endpoint (Task 31) and will be reused by future features (auto-tagging, deduplication).

---

## Context

`HaikuClient` is remember-core's sub-LLM client for lightweight AI operations (summary generation, feature extraction). The import endpoint needs it to generate parent summaries for imported text chunks. Rather than constructing it in the controller, we add it as a global provider — consistent with how `WEAVIATE_CLIENT`, `LOGGER`, and `CONFIRMATION_TOKEN_SERVICE` are wired.

---

## Steps

### 1. Add Provider to core.providers.ts

Add `HAIKU_CLIENT` symbol and provider factory:

```typescript
import { HaikuClient } from '@prmichaelsen/remember-core/services';

export const HAIKU_CLIENT = Symbol('HAIKU_CLIENT');

export const haikuClientProvider: Provider = {
  provide: HAIKU_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new HaikuClient({
      provider: configService.embeddingsConfig.provider,
      model: configService.embeddingsConfig.model,
      apiKey: configService.embeddingsConfig.apiKey,
      ...(configService.awsConfig.accessKeyId ? {
        aws: configService.awsConfig,
      } : {}),
    });
  },
  inject: [ConfigService],
};
```

### 2. Register in CoreModule

Add `haikuClientProvider` to `providers` array and `HAIKU_CLIENT` to `exports` array in `core.module.ts`.

### 3. Export from Barrel

Add `HAIKU_CLIENT` to `src/core/index.ts` exports.

### 4. Add Unit Test

Add test to `core.providers.spec.ts`:
- Verify provider constructs HaikuClient with correct config values
- Verify AWS config is included when `accessKeyId` is present
- Verify AWS config is omitted when `accessKeyId` is empty

---

## Verification

- [ ] `HAIKU_CLIENT` provider registered in CoreModule
- [ ] `HAIKU_CLIENT` exported from CoreModule
- [ ] `HAIKU_CLIENT` exported from `src/core/index.ts`
- [ ] Unit test passes for provider construction
- [ ] All existing tests still pass (`npm test`)
- [ ] Build succeeds (`npm run build`)

---

## Files Modified

- `src/core/core.providers.ts` — Add HAIKU_CLIENT symbol + provider
- `src/core/core.module.ts` — Register + export provider
- `src/core/index.ts` — Add barrel export
- `src/core/core.providers.spec.ts` — Add unit test
