# Import Endpoint

**Concept**: REST endpoint exposing remember-core's ImportService for bulk text-to-memory imports
**Created**: 2026-03-04
**Status**: Design Specification
**Source**: remember-core/agent/design/local.import-service.md

---

## Overview

This document describes the REST service's responsibilities for the bulk import feature. The heavy lifting — chunking, memory creation, parent summary generation, and relationship linking — lives in remember-core's `ImportService`. This service's job is:

1. Accept the HTTP request and validate the DTO
2. Wire up `ImportService` with the authenticated user's collection context
3. Return the result

This follows the same thin-adapter pattern as every other controller in this project.

---

## Problem Statement

- remember-core is adding `ImportService` for bulk text import (chunking + parent summaries + relationships)
- agentbase.me needs an HTTP endpoint to call this service from the web UI
- The REST service needs a controller action, DTO validation, and proper `ImportService` wiring — but no business logic

---

## Solution

Add a single `POST /api/svc/v1/memories/import` endpoint to the existing `MemoriesController`. This keeps import nested under `/memories/` since the primary output is memories, matching the convention used by `by-time`, `by-density`, `search`, `similar`, and `query`.

### Why MemoriesController (not a new controller)

- Import produces memories and relationships — it's a memory-creation action
- remember-core nests the import operation under `MemoryService`-adjacent code
- All existing `/memories/*` POST endpoints follow the same pattern (DTO → service call → return result)
- A separate `ImportController` would add a module, provider wiring, and barrel export for a single endpoint

---

## Implementation

### 1. DTO

```typescript
// src/memories/memories.dto.ts — add to existing file

class ImportItemDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  source_filename?: string;
}

class ImportMemoriesDto {
  @ValidateNested({ each: true })
  @Type(() => ImportItemDto)
  @ArrayMinSize(1)
  items: ImportItemDto[];

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  chunk_size?: number;

  @IsOptional()
  @IsString()
  context_conversation_id?: string;
}
```

### 2. Controller Action

```typescript
// src/memories/memories.controller.ts — add to MemoriesController

@Post('import')
async import(@User() userId: string, @Body() dto: ImportMemoriesDto) {
  const memoryService = await this.getService(userId);
  const relationshipService = await this.getRelationshipService(userId);
  const haikuClient = this.getHaikuClient();

  const importService = new ImportService(
    memoryService,
    relationshipService,
    haikuClient,
    this.logger,
  );

  return importService.import(dto as ImportInput);
}
```

### 3. Dependencies

`ImportService` requires three services: `MemoryService`, `RelationshipService`, and `HaikuClient`. The controller already has `MemoryService` wiring via `getService()`. Two additions are needed:

**RelationshipService**: The `MemoriesController` currently doesn't create relationships. Import needs it to link chunks to parent summaries. Options:

- **(a) Inject WEAVIATE_CLIENT and construct inline** — same pattern as `RelationshipsController.getService()`. Preferred: keeps it simple, no cross-module dependency.
- (b) Extract a shared provider — overkill for one endpoint.

**HaikuClient**: remember-core's sub-LLM client for summary generation. Needs embeddings/LLM config from `ConfigService`. Options:

- **(a) Add a `HAIKU_CLIENT` provider to CoreModule** — makes it injectable everywhere. Preferred: other future features (auto-tagging, deduplication) will also need it.
- (b) Construct in the controller — works but would duplicate config wiring.

### 4. Provider Addition (CoreModule)

```typescript
// src/core/core.providers.ts — add

export const HAIKU_CLIENT = Symbol('HAIKU_CLIENT');

export const haikuClientProvider: Provider = {
  provide: HAIKU_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new HaikuClient({
      provider: configService.embeddingsConfig.provider,
      model: configService.embeddingsConfig.model,
      apiKey: configService.embeddingsConfig.apiKey,
      // AWS config if provider is bedrock
      ...(configService.awsConfig.accessKeyId ? {
        aws: configService.awsConfig,
      } : {}),
    });
  },
  inject: [ConfigService],
};
```

Register in `CoreModule` providers and exports.

### 5. Request/Response

```
POST /api/svc/v1/memories/import
Authorization: Bearer <jwt>

Request:
{
  "items": [
    { "content": "...", "source_filename": "notes.txt" },
    { "content": "..." }
  ],
  "chunk_size": 3000,
  "context_conversation_id": "conv-123"
}

Response (200):
{
  "items": [
    {
      "import_id": "uuid-1",
      "parent_memory_id": "mem-parent-1",
      "chunk_memory_ids": ["mem-c1", "mem-c2", "mem-c3"],
      "chunk_count": 3,
      "source_filename": "notes.txt",
      "summary": "Personal notes about..."
    }
  ],
  "total_memories_created": 8
}
```

### 6. Error Cases

| Scenario | HTTP Status | Source |
|---|---|---|
| Empty items array | 400 | DTO validation (`@ArrayMinSize(1)`) |
| Missing content field | 400 | DTO validation (`@IsString()`) |
| chunk_size out of range | 400 | DTO validation (`@Min(500)`, `@Max(10000)`) |
| No auth token | 401 | AuthGuard |
| HaikuClient failure | 502 | AppErrorFilter (remember-core `external` error) |
| Weaviate write failure | 502 | AppErrorFilter (remember-core `external` error) |

### 7. File Changes

```
src/memories/
  memories.dto.ts           # Add ImportItemDto, ImportMemoriesDto
  memories.controller.ts    # Add import() action, getRelationshipService(), inject HAIKU_CLIENT
  memories.controller.spec.ts # Add import tests

src/core/
  core.providers.ts         # Add HAIKU_CLIENT provider
  core.module.ts            # Register + export HAIKU_CLIENT
```

---

## Benefits

- **Zero business logic in REST service** — ImportService in remember-core owns chunking, summary generation, and relationship linking
- **Reuses existing patterns** — same DTO validation, auth guard, error filter, and controller structure as all other endpoints
- **Minimal surface area** — one new endpoint, two new DTOs, one new provider
- **Consumer-ready** — agentbase.me can call this endpoint directly from its import UI

---

## Trade-offs

- **Long-running request** — importing 50+ chunks creates memories sequentially. Could take 30-60s. No streaming progress in MVP. Mitigated by: reasonable chunk sizes, Cloud Run 60s timeout is sufficient for most imports.
- **HaikuClient provider scope** — adding a global provider for one endpoint. Mitigated by: other features will need it (auto-tagging, dedup).
- **RelationshipService construction in MemoriesController** — slightly expands controller responsibility. Mitigated by: import is conceptually a memory operation; the relationship creation is an implementation detail of ImportService.

---

## Dependencies

- `@prmichaelsen/remember-core` — must expose `ImportService`, `ImportInput`, `ImportResult` from `services` barrel export
- `HaikuClient` — must be exported from remember-core (already exists, needs barrel export verification)
- Existing: `MemoryService`, `RelationshipService`, `WEAVIATE_CLIENT`, `LOGGER`, `ConfigService`

### Blocking On

- remember-core `ImportService` implementation (not yet merged)

---

## Testing Strategy

- **Unit: DTO validation** — verify `ImportItemDto` and `ImportMemoriesDto` enforce required fields, array min size, chunk_size bounds
- **Unit: controller action** — mock `ImportService`, verify it's constructed with correct dependencies, called with correct input, result returned as-is
- **Unit: HaikuClient provider** — verify construction with config values
- **E2E** — not needed in this service; remember-core's integration tests cover the import flow end-to-end

---

## Future Considerations

- **Streaming progress**: SSE or WebSocket endpoint for import progress updates ("Processing chunk 3 of 12...")
- **App-tier endpoint**: `POST /api/app/v1/import` with file upload support (multipart form data → content extraction → ImportService)
- **Request size limits**: May need to increase NestJS body parser limit for large imports (default 100KB may be too small for multi-file imports)
- **Timeout handling**: For very large imports, consider a job-based pattern (return 202 + job ID, poll for status)

---

**Status**: Design Specification
**Recommendation**: Implement after remember-core merges ImportService. Estimated effort: 2-3 hours (DTO + controller action + provider + tests).
**Related Documents**:
- remember-core/agent/design/local.import-service.md (core service design)
- agent/design/local.rest-api-architecture.md (endpoint conventions)
- agent/milestones/milestone-3-api-controllers.md (controller pattern reference)
