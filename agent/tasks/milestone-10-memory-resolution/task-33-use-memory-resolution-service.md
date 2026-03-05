# Task 33: App-Tier Memories Controller with MemoryResolutionService

**Milestone**: [M10 - Memory Resolution Fallback](../../milestones/milestone-10-memory-resolution.md)
**Estimated Time**: 1-2 hours
**Dependencies**: [Task 32](task-32-bump-remember-core.md)
**Status**: Not Started

---

## Objective

Create a new app-tier memories controller at `GET /api/app/v1/memories/:id` that uses `MemoryResolutionService` for cross-collection fallback. This matches the `AppClient.memories.get()` SDK method added in remember-core v0.27.0.

---

## Context

The remember-core SDK architecture has two tiers:
- **Svc tier** (`/api/svc/v1/`) — 1:1 raw CRUD, no fallback
- **App tier** (`/api/app/v1/`) — compound, use-case-oriented operations

`AppClient.memories.get()` (added in remember-core v0.27.0) calls `GET /api/app/v1/memories/:id` with `includeRelationships` and `relationshipMemoryLimit` options. agentbase.me already calls this from `src/routes/memory/$memoryId.tsx`. However, the server-side handler **doesn't exist yet**.

The app-tier endpoint should:
1. Use `MemoryResolutionService.resolve()` for cross-collection fallback
2. Optionally include relationships with memory previews (compound response)
3. Return `MemoryWithRelationships` shape matching the SDK types

The svc-tier `GET /api/svc/v1/memories/:id` stays unchanged (raw, single-collection).

---

## Steps

### 1. Create App Memories Controller

**File**: `src/app/memories/memories.controller.ts`

```typescript
@Controller('api/app/v1/memories')
export class AppMemoriesController {
  constructor(
    @Inject(WEAVIATE_CLIENT) private readonly weaviateClient: any,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  @Get(':id')
  async getById(
    @User() userId: string,
    @Param('id') id: string,
    @Query('includeRelationships') includeRelationships?: string,
    @Query('relationshipMemoryLimit') relationshipMemoryLimit?: string,
  ) {
    const resolver = new MemoryResolutionService(this.weaviateClient, userId, this.logger);
    const resolved = await resolver.resolve(id);
    if (!resolved) {
      throw new NotFoundException(`Memory not found: ${id}`);
    }

    const result: Record<string, unknown> = { memory: resolved.memory };

    if (includeRelationships === 'true') {
      // Fetch relationships for this memory
      // Use resolved.collectionName for correct collection
      const collection = this.weaviateClient.collections.get(resolved.collectionName);
      const relationshipService = new RelationshipService(collection, userId, this.logger);
      const limit = relationshipMemoryLimit ? parseInt(relationshipMemoryLimit) : 5;
      const rels = await relationshipService.search({ memory_id: id, limit });
      result.relationships = rels.relationships ?? [];
    }

    return result;
  }
}
```

### 2. Register in AppTierModule

**File**: `src/app/app-tier.module.ts`

Add `AppMemoriesController` to the module's controllers array.

### 3. Create unit tests

**File**: `src/app/memories/memories.controller.spec.ts`

- Test: returns memory from user collection (happy path)
- Test: falls back to user collection when memory not in requested collection
- Test: returns 404 when memory not found anywhere
- Test: includes relationships when `includeRelationships=true`
- Test: respects `relationshipMemoryLimit`

### 4. Verify

```bash
npm run build
npm run test
```

---

## Verification

- [ ] `GET /api/app/v1/memories/:id` endpoint exists
- [ ] Uses `MemoryResolutionService.resolve()` (no author/space/group params needed — always resolves with fallback)
- [ ] Returns `{ memory, relationships? }` matching `MemoryWithRelationships` SDK type
- [ ] Relationships include memory previews when `includeRelationships=true`
- [ ] Returns 404 when memory not found
- [ ] Registered in `AppTierModule`
- [ ] Unit tests pass
- [ ] TypeScript builds cleanly
- [ ] Svc-tier `GET /api/svc/v1/memories/:id` unchanged

---

## Notes

- The app-tier endpoint does NOT take `author/space/group` query params — `MemoryResolutionService` tries user's own collection with no context, which is the right default for the memory detail page
- The svc-tier endpoint stays as-is for raw, explicit collection access
- `AppClient.memories.get()` in remember-core already calls this endpoint — once deployed, agentbase.me's `(appClient as any)` cast will work correctly
- Follow existing app-tier controller patterns (see `ProfilesController`, `GhostSearchController`)
