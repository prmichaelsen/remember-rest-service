import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppRelationshipsController } from './app-relationships.controller.js';
import { WEAVIATE_CLIENT, LOGGER, MEMORY_INDEX } from '../../core/core.providers.js';

const mockMemoryService = {
  getById: jest.fn(),
};

const mockRelationshipService = {
  getById: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
  RelationshipService: jest.fn().mockImplementation(() => mockRelationshipService),
}));

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  ensureUserCollection: jest.fn().mockResolvedValue(false),
}));

const mockCollection = { data: {} };
const mockWeaviateClient = {
  collections: {
    get: jest.fn().mockReturnValue(mockCollection),
  },
};

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockMemoryIndex = {
  index: jest.fn(),
  lookup: jest.fn(),
};

describe('AppRelationshipsController', () => {
  let controller: AppRelationshipsController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AppRelationshipsController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
      ],
    }).compile();

    controller = module.get(AppRelationshipsController);
  });

  describe('GET /:relationshipId/memories', () => {
    it('should throw NotFoundException when relationship not found', async () => {
      mockRelationshipService.getById.mockResolvedValue({ found: false });

      await expect(
        controller.getRelationshipMemories(userId, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated memories for a relationship', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          relationship_type: 'related',
          related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'Charlie', content: 'c' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'Alpha', content: 'a' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', title: 'Bravo', content: 'b' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      expect(result.total).toBe(3);
      expect(result.has_more).toBe(false);
      // Sorted alphabetically by title
      expect(result.memories[0].title).toBe('Alpha');
      expect(result.memories[1].title).toBe('Bravo');
      expect(result.memories[2].title).toBe('Charlie');
      expect(result.relationship.memory_ids).toEqual(['mem-1', 'mem-2', 'mem-3']);
    });

    it('should filter out soft-deleted memories', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'Active', content: 'a' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'Deleted', content: 'b', deleted_at: '2024-01-01' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      expect(result.total).toBe(1);
      expect(result.memories[0].title).toBe('Active');
    });

    it('should apply offset and limit pagination', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'A', content: 'a' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'B', content: 'b' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', title: 'C', content: 'c' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1', '1', '1');

      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].title).toBe('B');
      expect(result.total).toBe(3);
      expect(result.has_more).toBe(true);
    });

    it('should sort memories by member_order position when present', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          relationship_type: 'script',
          related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
          member_order: { 'mem-1': 2, 'mem-2': 0, 'mem-3': 1 },
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'Third', content: 'c' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'First', content: 'a' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', title: 'Second', content: 'b' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      // Sorted by position: mem-2 (0), mem-3 (1), mem-1 (2)
      expect(result.memories[0].id).toBe('mem-2');
      expect(result.memories[1].id).toBe('mem-3');
      expect(result.memories[2].id).toBe('mem-1');
    });

    it('should include position field on each memory', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2'],
          member_order: { 'mem-1': 1, 'mem-2': 0 },
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'B', content: 'b' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'A', content: 'a' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      expect(result.memories[0].position).toBe(0);
      expect(result.memories[0].id).toBe('mem-2');
      expect(result.memories[1].position).toBe(1);
      expect(result.memories[1].id).toBe('mem-1');
    });

    it('should include member_order in relationship metadata', async () => {
      const memberOrder = { 'mem-1': 0, 'mem-2': 1 };
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2'],
          member_order: memberOrder,
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'A', content: 'a' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'B', content: 'b' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      expect(result.relationship.member_order).toEqual(memberOrder);
    });

    it('should fall back to alphabetical sort when no member_order', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'Zebra', content: 'z' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'Apple', content: 'a' } });

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      // Alphabetical: Apple before Zebra
      expect(result.memories[0].id).toBe('mem-2');
      expect(result.memories[1].id).toBe('mem-1');
      // Position should still be present (index-based fallback)
      expect(result.memories[0].position).toBe(0);
      expect(result.memories[1].position).toBe(1);
    });

    it('should handle missing memories gracefully', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-missing'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', title: 'Found', content: 'a' } })
        .mockRejectedValueOnce(new Error('Memory not found'));

      const result = await controller.getRelationshipMemories(userId, 'rel-1');

      expect(result.total).toBe(1);
      expect(result.memories[0].title).toBe('Found');
    });
  });

  describe('GET /:relationshipId/ordered-content', () => {
    it('should throw NotFoundException when relationship not found', async () => {
      mockRelationshipService.getById.mockResolvedValue({ found: false });

      await expect(
        controller.getOrderedContent(userId, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return full memory objects with _position field added', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          relationship_type: 'script',
          related_memory_ids: ['mem-1', 'mem-2'],
          member_order: { 'mem-1': 1, 'mem-2': 0 },
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'First content', tags: ['a'], created_at: '2026-01-01T00:00:00Z' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Second content', tags: ['b'], created_at: '2026-01-02T00:00:00Z' } });

      const result = await controller.getOrderedContent(userId, 'rel-1');

      expect(result.items).toHaveLength(2);
      // Sorted by position: mem-2 (0), mem-1 (1)
      expect(result.items[0]._position).toBe(0);
      expect(result.items[0].id).toBe('mem-2');
      expect(result.items[0].content).toBe('Second content');
      expect(result.items[1]._position).toBe(1);
      expect(result.items[1].id).toBe('mem-1');
      expect(result.items[1].content).toBe('First content');
    });

    it('should use array key "items" not "memories"', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'c', tags: [], created_at: '2026-01-01T00:00:00Z' } });

      const result = await controller.getOrderedContent(userId, 'rel-1');

      expect(result.items).toBeDefined();
      expect((result as any).memories).toBeUndefined();
    });

    it('should backfill _position from array order when no member_order', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-a', 'mem-b'],
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-a', content: 'Zebra', tags: [], created_at: '2026-01-01T00:00:00Z' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-b', content: 'Apple', tags: [], created_at: '2026-01-02T00:00:00Z' } });

      const result = await controller.getOrderedContent(userId, 'rel-1');

      // Without member_order, fallback to array order (mem-a first, mem-b second)
      expect(result.items[0].id).toBe('mem-a');
      expect(result.items[0]._position).toBe(0);
      expect(result.items[1].id).toBe('mem-b');
      expect(result.items[1]._position).toBe(1);
    });

    it('should paginate with offset and limit', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-1',
          related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
          member_order: { 'mem-1': 0, 'mem-2': 1, 'mem-3': 2 },
        },
      });

      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'a', tags: [], created_at: '2026-01-01T00:00:00Z' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'b', tags: [], created_at: '2026-01-02T00:00:00Z' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', content: 'c', tags: [], created_at: '2026-01-03T00:00:00Z' } });

      const result = await controller.getOrderedContent(userId, 'rel-1', '1', '1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('mem-2');
      expect(result.total).toBe(3);
      expect(result.has_more).toBe(true);
    });
  });
});
