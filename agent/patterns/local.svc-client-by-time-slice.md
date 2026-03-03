# Pattern: SVC Client — byTimeSlice Integration

**Namespace**: local
**Category**: Integration
**Created**: 2026-03-03
**Status**: Active

---

## Overview

How consumers use the remember-core SVC client SDK to call `POST /api/svc/v1/memories/by-time-slice`. One REST call in, 14 Weaviate queries happen server-side, one response out.

This endpoint combines text search with chronological ordering — it partitions the time axis into 14 buckets, runs parallel searches per bucket, and returns results in time order.

---

## When to Use This Pattern

**Use `byTimeSlice` when:**
- You need search results ordered chronologically (not by relevance)
- You want text-matched results spread across the user's full memory timeline
- You're building a timeline view that also filters by search query

**Don't use `byTimeSlice` when:**
- You only need chronological listing without text search — use `byTime` instead
- You need relevance-ranked results — use `search` instead
- You need density-ranked results — use `byDensity` instead

---

## Quick Start

```typescript
import { createSvcClient } from '@prmichaelsen/remember-core/clients/svc/v1';

const svc = createSvcClient({ baseUrl: 'https://your-server.com', apiKey: '...' });

const res = await svc.memories.byTimeSlice(userId, {
  query: 'vacation plans',
  limit: 20,
  offset: 0,
  direction: 'desc',
});

const { memories, total } = res.throwOnError();
```

---

## API Shape

### Request — `TimeSliceSearchInput`

From `components["schemas"]["TimeSliceSearchInput"]` in the OpenAPI spec:

| Field       | Type                | Required | Default | Description                              |
|-------------|---------------------|----------|---------|------------------------------------------|
| `query`     | `string`            | Yes      | —       | Search text (the defining field)         |
| `limit`     | `number`            | No       | `10`    | Max results to return (1–500)            |
| `offset`    | `number`            | No       | `0`     | Pagination offset                        |
| `direction` | `'asc' \| 'desc'`   | No       | `'desc'`| Chronological order                      |
| `filters`   | `SearchFilters`     | No       | —       | Standard memory filters (types, tags, dates, etc.) |

### Response — `TimeSliceSearchResult`

```typescript
{
  memories: Record<string, unknown>[];  // Array of memory objects
  total: number;                        // Estimated total across all buckets
}
```

### Errors

| Status | Meaning            |
|--------|--------------------|
| 400    | Validation error (missing `query`, invalid params) |
| 401    | Unauthorized       |

---

## SVC Client Method

```typescript
// MemoriesResource interface
byTimeSlice(userId: string, input: Record<string, unknown>): Promise<SdkResponse<unknown>>;
```

The SVC client sends `POST /api/svc/v1/memories/by-time-slice` with the input as the JSON body and the userId as the `x-user-id` header.

---

## Examples

### Basic: Recent memories matching a query

```typescript
const res = await svc.memories.byTimeSlice(userId, {
  query: 'project deadlines',
  limit: 10,
  direction: 'desc',
});
const { memories } = res.throwOnError();
// memories are ordered newest-first, text-matched to "project deadlines"
```

### Oldest-first with filters

```typescript
const res = await svc.memories.byTimeSlice(userId, {
  query: 'meeting notes',
  limit: 50,
  offset: 0,
  direction: 'asc',
  filters: {
    types: ['note'],
    tags: ['work'],
    date_from: '2025-01-01T00:00:00Z',
  },
});
const { memories, total } = res.throwOnError();
```

### Paginated

```typescript
// Page 1
const page1 = await svc.memories.byTimeSlice(userId, {
  query: 'recipes',
  limit: 20,
  offset: 0,
  direction: 'desc',
});

// Page 2
const page2 = await svc.memories.byTimeSlice(userId, {
  query: 'recipes',
  limit: 20,
  offset: 20,
  direction: 'desc',
});
```

### Error handling

```typescript
const res = await svc.memories.byTimeSlice(userId, {
  query: 'travel',
  limit: 10,
  direction: 'desc',
});

if (res.error) {
  console.error(`Search failed: ${res.error.code} — ${res.error.message}`);
  return;
}

const { memories, total } = res.data!;
```

---

## How It Works Server-Side

The REST handler at `POST /api/svc/v1/memories/by-time-slice`:

1. Constructs a `MemoryService` scoped to the user's Weaviate collection
2. Calls `searchByTimeSlice(memoryService, query, options)` from `@prmichaelsen/remember-core/search`
3. `searchByTimeSlice` partitions the time axis into 14 buckets:
   - **desc**: Exponentially-graded buckets anchored at now (recent time has finer resolution)
   - **asc**: Equal-width buckets spanning from the user's oldest memory to now
4. Fires 14 parallel `memoryService.search()` calls (one per bucket, each with date range filters)
5. Collects results, applies offset/limit, returns the merged array

The consumer sees a single request/response. The 14 Weaviate queries are an implementation detail.

---

## Differences From Other Endpoints

| Endpoint       | Input           | Ordering       | Use Case                          |
|----------------|-----------------|----------------|-----------------------------------|
| `search`       | `query` required | By relevance   | Find best matches                 |
| `byTime`       | No query        | Chronological  | Browse timeline                   |
| `byTimeSlice`  | `query` required | Chronological  | Search + timeline (this pattern)  |
| `byDensity`    | No query        | By connections | Find well-connected memories      |

The key distinction: `byTimeSlice` = text search + chronological ordering. Without a `query`, use `byTime`. Without time ordering, use `search`.

---

## Related Patterns

- **[REST Adapter](core-sdk.adapter-rest.md)** — How REST endpoints are structured
- **[Service Interface](core-sdk.service-interface.md)** — The MemoryService that backs this endpoint

---

**Status**: Active
**Compatibility**: remember-core >= 0.23.0
**Last Updated**: 2026-03-03
