# Task 31: Add Import Endpoint

**Milestone**: [M9 - Import Endpoint](../../milestones/milestone-9-import-endpoint.md)
**Estimated Time**: 2 hours
**Dependencies**: [Task 30](task-30-add-haiku-client-provider.md), remember-core `ImportService` (not yet merged)
**Status**: Not Started

---

## Objective

Add `POST /api/svc/v1/memories/import` endpoint to `MemoriesController` that accepts bulk text items, wires up remember-core's `ImportService` with the user's collection context, and returns the import result.

---

## Context

remember-core's `ImportService` handles: token-count chunking, batch memory creation, parent summary generation via HaikuClient, and relationship linking. This task adds the REST adapter — DTO validation, service wiring, and the controller action. Follows the same pattern as `by-time`, `by-density`, `search`, etc.

**Design**: [agent/design/local.import-endpoint.md](../../design/local.import-endpoint.md)

---

## Steps

### 1. Add DTOs to memories.dto.ts

```typescript
export class ImportItemDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  source_filename?: string;
}

export class ImportMemoriesDto {
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

Imports needed: `ArrayMinSize`, `ValidateNested`, `Min`, `Max`, `IsInt` from `class-validator`; `Type` from `class-transformer`.

### 2. Add RelationshipService Helper to MemoriesController

Add a `getRelationshipService()` method, following the same pattern as `RelationshipsController`:

```typescript
import { RelationshipService } from '@prmichaelsen/remember-core/services';

private async getRelationshipService(userId: string): Promise<RelationshipService> {
  await safeEnsureUserCollection(this.weaviateClient, userId);
  const collectionName = getCollectionName(CollectionType.USERS, userId);
  const collection = this.weaviateClient.collections.get(collectionName);
  return new RelationshipService(collection, userId, this.logger);
}
```

### 3. Inject HAIKU_CLIENT in Constructor

Add `@Inject(HAIKU_CLIENT) private readonly haikuClient: any` to the `MemoriesController` constructor.

### 4. Add Controller Action

```typescript
import { ImportService, type ImportInput } from '@prmichaelsen/remember-core/services';

@Post('import')
async import(@User() userId: string, @Body() dto: ImportMemoriesDto) {
  const memoryService = await this.getService(userId);
  const relationshipService = await this.getRelationshipService(userId);

  const importService = new ImportService(
    memoryService,
    relationshipService,
    this.haikuClient,
    this.logger,
  );

  return importService.import(dto as ImportInput);
}
```

### 5. Consider Request Size Limit

NestJS default body parser limit is 100KB. Large imports may exceed this. Add body size configuration in `main.ts` if needed:

```typescript
const app = await NestFactory.create(AppModule, {
  bodyParser: true,
});
// Or configure express body parser limit:
app.use(json({ limit: '5mb' }));
```

Decide on limit based on expected import sizes (a 50-page document is ~100KB of text, so 1MB should be sufficient for MVP).

### 6. Add Unit Tests

In `memories.controller.spec.ts`, add tests:

1. **import() calls ImportService.import with correct input** — mock ImportService constructor, verify it receives MemoryService, RelationshipService, HaikuClient, Logger. Verify `.import()` called with dto.
2. **import() returns ImportService result** — verify passthrough.
3. **DTO validation: empty items array** — verify 400 response.
4. **DTO validation: missing content** — verify 400 response.
5. **DTO validation: chunk_size below 500** — verify 400 response.
6. **DTO validation: chunk_size above 10000** — verify 400 response.
7. **DTO validation: valid request passes** — verify no validation errors.

---

## Verification

- [ ] `POST /api/svc/v1/memories/import` responds with 200 on valid request
- [ ] Empty items array returns 400
- [ ] Missing content field returns 400
- [ ] Invalid chunk_size returns 400
- [ ] Unauthenticated request returns 401
- [ ] ImportService receives correct dependencies (MemoryService, RelationshipService, HaikuClient, Logger)
- [ ] Result is passed through from ImportService without transformation
- [ ] All existing tests still pass
- [ ] New unit tests pass (7+ tests)
- [ ] Build succeeds

---

## Files Modified

- `src/memories/memories.dto.ts` — Add ImportItemDto, ImportMemoriesDto
- `src/memories/memories.controller.ts` — Add import() action, getRelationshipService(), inject HAIKU_CLIENT
- `src/memories/memories.controller.spec.ts` — Add import unit tests
- `src/main.ts` — Increase body parser limit (if needed)
