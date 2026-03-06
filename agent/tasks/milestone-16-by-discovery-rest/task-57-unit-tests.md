# Task 57: Unit Tests

**Milestone**: [M16 - byDiscovery REST Endpoints](../../milestones/milestone-16-by-discovery-rest.md)
**Estimated Time**: 0.5 hours
**Dependencies**: [Task 55](task-55-memories-by-discovery-endpoint.md), [Task 56](task-56-spaces-by-discovery-endpoint.md)
**Status**: Not Started

---

## Objective

Add unit tests for both byDiscovery endpoints, following existing test patterns.

---

## Steps

### 1. Memories Controller Tests

Add to `src/memories/memories.controller.spec.ts`:

```typescript
describe('byDiscovery', () => {
  it('should call service.byDiscovery with dto', async () => {
    const dto = { limit: 10, offset: 0 };
    const expected = { memories: [], total: 0, offset: 0, limit: 10 };
    mockMemoryService.byDiscovery.mockResolvedValue(expected);

    const result = await controller.byDiscovery('user1', dto);

    expect(mockMemoryService.byDiscovery).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should pass filters through', async () => {
    const dto = { limit: 5, filters: { content_type: 'note' } };
    mockMemoryService.byDiscovery.mockResolvedValue({ memories: [], total: 0, offset: 0, limit: 5 });

    await controller.byDiscovery('user1', dto);

    expect(mockMemoryService.byDiscovery).toHaveBeenCalledWith(dto);
  });
});
```

### 2. Spaces Controller Tests

Add to `src/spaces/spaces.controller.spec.ts`:

```typescript
describe('byDiscovery', () => {
  it('should call service.byDiscovery with dto', async () => {
    const dto = { spaces: ['space1'], limit: 10 };
    const expected = { memories: [], spaces_searched: ['space1'], groups_searched: [], total: 0 };
    mockSpaceService.byDiscovery.mockResolvedValue(expected);

    const result = await controller.byDiscovery('user1', dto);

    expect(mockSpaceService.byDiscovery).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
```

### 3. Add byDiscovery to Mock Services

Add `byDiscovery: jest.fn()` to both `mockMemoryService` and `mockSpaceService` in the respective test files.

---

## Verification

- [ ] All new tests pass
- [ ] No regressions in existing tests
- [ ] Mock setup matches actual service interface

---

**Related**: [Task 45: byRating Sort Endpoint](../../tasks/milestone-13-memory-ratings-rest/task-45-by-rating-sort-endpoint.md) (same pattern)
