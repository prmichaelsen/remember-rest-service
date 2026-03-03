# Task 1: Add Sort Mode REST Endpoints

**Milestone**: [M3 - Sort Mode Endpoints](../../milestones/milestone-3-sort-mode-endpoints.md)
**Estimated Time**: 2 hours
**Dependencies**: remember-core M11 completed and published to npm
**Status**: Not Started

---

## Objective

Add REST API endpoints for Time and Density sort modes by wrapping remember-core's `MemoryService.byTime()` and `MemoryService.byDensity()` methods. Enable clients to access these sorting capabilities via HTTP POST requests.

---

## Context

remember-core M11 added two new sort mode methods to MemoryService:
- `byTime()`: Chronological sorting by created_at
- `byDensity()`: Sort by relationship count (highly-connected memories first)

These need to be exposed via REST endpoints so web/mobile clients can use them. Smart mode already exists via the existing `/memories/search` endpoint.

This follows the design doc at remember-core/agent/design/memory-sorting-algorithms.md (Phase 1 MVP).

---

## Steps

### 1. Verify remember-core Version

Ensure remember-core is updated with M11 changes:

```bash
cd remember-rest-service
npm list @prmichaelsen/remember-core
# Should show version with byTime/byDensity methods (v0.18.0+)
```

If not updated:
```bash
npm update @prmichaelsen/remember-core
```

### 2. Add POST /memories/by-time Endpoint

Add route handler (location depends on your routing structure, e.g., `src/routes/memories.ts`):

```typescript
import { MemoryService } from '@prmichaelsen/remember-core';

// Request schema (Zod or similar)
const TimeModeRequestSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  filters: z.object({
    content_type: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    min_weight: z.number().optional(),
  }).optional(),
});

// Route handler
app.post('/memories/by-time', authenticate, async (req, res) => {
  try {
    // Validate request body
    const input = TimeModeRequestSchema.parse(req.body);

    // Get user's memory collection
    const collection = await getMemoryCollection(req.user.id);

    // Create MemoryService instance
    const memoryService = new MemoryService(
      collection,
      req.user.id,
      logger,
    );

    // Call byTime method
    const result = await memoryService.byTime(input);

    // Return response
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});
```

### 3. Add POST /memories/by-density Endpoint

Similar pattern:

```typescript
const DensityModeRequestSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
  min_relationship_count: z.number().int().nonnegative().optional(),
  filters: z.object({
    content_type: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

app.post('/memories/by-density', authenticate, async (req, res) => {
  try {
    const input = DensityModeRequestSchema.parse(req.body);

    const collection = await getMemoryCollection(req.user.id);
    const memoryService = new MemoryService(collection, req.user.id, logger);

    const result = await memoryService.byDensity(input);

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});
```

### 4. Update OpenAPI Spec (if exists)

If you have an OpenAPI spec file (e.g., `docs/openapi.yaml`), add the new endpoints:

```yaml
paths:
  /memories/by-time:
    post:
      summary: Get memories sorted chronologically
      tags: [Memories]
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                limit:
                  type: integer
                  default: 50
                  maximum: 500
                offset:
                  type: integer
                  default: 0
                direction:
                  type: string
                  enum: [asc, desc]
                  default: desc
                filters:
                  type: object
                  # ... filter schema
      responses:
        200:
          description: Sorted memories
          content:
            application/json:
              schema:
                type: object
                properties:
                  memories:
                    type: array
                    items:
                      $ref: '#/components/schemas/Memory'
                  total:
                    type: integer
                  offset:
                    type: integer
                  limit:
                    type: integer

  /memories/by-density:
    # Similar structure
```

### 5. Add Integration Tests

Create or update tests (e.g., `tests/integration/memories.test.ts`):

```typescript
describe('POST /memories/by-time', () => {
  it('should return memories sorted newest first by default', async () => {
    const response = await request(app)
      .post('/memories/by-time')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ limit: 10 })
      .expect(200);

    expect(response.body.memories).toHaveLength(10);
    // Verify descending order
    for (let i = 0; i < response.body.memories.length - 1; i++) {
      const current = new Date(response.body.memories[i].created_at);
      const next = new Date(response.body.memories[i + 1].created_at);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });

  it('should support ascending order', async () => {
    const response = await request(app)
      .post('/memories/by-time')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ limit: 10, direction: 'asc' })
      .expect(200);

    // Verify ascending order
    for (let i = 0; i < response.body.memories.length - 1; i++) {
      const current = new Date(response.body.memories[i].created_at);
      const next = new Date(response.body.memories[i + 1].created_at);
      expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
    }
  });

  it('should require authentication', async () => {
    await request(app)
      .post('/memories/by-time')
      .send({ limit: 10 })
      .expect(401);
  });
});

describe('POST /memories/by-density', () => {
  it('should return memories sorted by relationship_count', async () => {
    const response = await request(app)
      .post('/memories/by-density')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ limit: 10 })
      .expect(200);

    expect(response.body.memories).toHaveLength(10);
    // Verify descending order by relationship_count
    for (let i = 0; i < response.body.memories.length - 1; i++) {
      const current = response.body.memories[i].relationship_count;
      const next = response.body.memories[i + 1].relationship_count;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should filter by min_relationship_count', async () => {
    const response = await request(app)
      .post('/memories/by-density')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ limit: 10, min_relationship_count: 5 })
      .expect(200);

    for (const memory of response.body.memories) {
      expect(memory.relationship_count).toBeGreaterThanOrEqual(5);
    }
  });
});
```

---

## Verification

- [ ] POST /memories/by-time endpoint exists
- [ ] POST /memories/by-density endpoint exists
- [ ] Both endpoints require authentication
- [ ] Request validation works (rejects invalid inputs)
- [ ] Responses match expected format
- [ ] Pagination works (offset/limit)
- [ ] Filters apply correctly
- [ ] Integration tests pass
- [ ] OpenAPI spec updated (if applicable)
- [ ] Endpoints documented in README (if applicable)

---

## Expected Output

**POST /memories/by-time**:
```bash
curl -X POST https://api.remember.example.com/memories/by-time \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20,
    "direction": "desc"
  }'
```

**Response**:
```json
{
  "memories": [
    {
      "id": "abc123",
      "content": "Most recent memory",
      "created_at": "2026-03-03T10:00:00Z",
      ...
    },
    {
      "id": "def456",
      "content": "Older memory",
      "created_at": "2026-03-02T15:30:00Z",
      ...
    }
  ],
  "total": 2,
  "offset": 0,
  "limit": 20
}
```

---

## Common Issues and Solutions

### Issue 1: remember-core version doesn't have byTime/byDensity
**Symptom**: TypeScript error "Property 'byTime' does not exist on type 'MemoryService'"
**Solution**: Update remember-core to v0.18.0+ with `npm update @prmichaelsen/remember-core`

### Issue 2: Authentication middleware not applied
**Symptom**: Endpoints accessible without token
**Solution**: Ensure `authenticate` middleware is applied to both routes

### Issue 3: Validation schema too strict/loose
**Symptom**: Valid requests rejected or invalid requests accepted
**Solution**: Review Zod schemas against remember-core's TypeScript interfaces

---

## Resources

- [Design Doc](https://github.com/prmichaelsen/remember-core/blob/main/agent/design/memory-sorting-algorithms.md): Full design for memory sorting system
- [remember-core MemoryService](https://github.com/prmichaelsen/remember-core/blob/main/src/services/memory.service.ts): Source implementation

---

## Notes

- Smart mode endpoint already exists (POST /memories/search)
- These endpoints complete Phase 1 MVP for sorting
- Phase 2 will add /memories/by-dynamic (REM curated) and /memories/by-quality (RAG)
- Keep response format consistent with existing memory endpoints
- Consider rate limiting if high traffic expected

---

**Next Task**: Frontend integration (different repository)
**Related Design Docs**: remember-core/agent/design/memory-sorting-algorithms.md
**Estimated Completion Date**: TBD
