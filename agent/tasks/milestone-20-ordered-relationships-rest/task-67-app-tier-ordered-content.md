# Task 67: App-Tier Ordered Content Response

**Status**: not_started
**Milestone**: M20 — Ordered Relationships REST Endpoints
**Created**: 2026-03-13
**Estimated Hours**: 1
**Dependencies**: None (remember-core member_order assumed available on relationship objects)

---

## Objective

Update `AppRelationshipsController.getRelationshipMemories()` to return memories sorted by `member_order` position instead of alphabetically, and include a `position` field on each item.

## Context

Currently `GET /api/app/v1/relationships/:id/memories` sorts results alphabetically by title/content. With ordered relationships, the relationship object returned by `RelationshipService.getById()` will include a `member_order` field (parsed from `member_order_json`) — a `Record<string, number>` mapping memory_id to zero-indexed position.

The app-tier should:
1. Sort by position when `member_order` is present, fall back to current alphabetical sort otherwise
2. Add `position` to each returned memory item
3. Include `member_order` in the relationship metadata

## Steps

### 1. Update sort logic in `app-relationships.controller.ts`

Replace the alphabetical sort with position-aware sort:

```typescript
const memberOrder = (relationship.member_order as Record<string, number>) ?? null;

const filtered = allMemories
  .filter((m): m is Record<string, unknown> => m !== null && !m.deleted_at)
  .sort((a, b) => {
    if (memberOrder) {
      const posA = memberOrder[a.id as string] ?? Number.MAX_SAFE_INTEGER;
      const posB = memberOrder[b.id as string] ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    }
    // Fallback: alphabetical by title/content
    const titleA = ((a.title as string) || (a.content as string) || '').toLowerCase();
    const titleB = ((b.title as string) || (b.content as string) || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });
```

### 2. Add `position` field to response items

After pagination, map items to include position:

```typescript
const paginated = filtered.slice(offset, offset + limit).map((m, idx) => ({
  ...m,
  position: memberOrder ? (memberOrder[m.id as string] ?? offset + idx) : offset + idx,
}));
```

### 3. Include `member_order` in relationship metadata

Ensure `member_order` is not stripped from the relationship metadata in the response destructuring.

## Verification

- [ ] Memories sorted by position when `member_order` exists on relationship
- [ ] Falls back to alphabetical when `member_order` is absent
- [ ] Each memory in response has `position` field
- [ ] Pagination applies correctly to position-sorted list
- [ ] `member_order` included in relationship metadata
- [ ] Soft-deleted memories still filtered out
- [ ] Missing memories still handled gracefully
