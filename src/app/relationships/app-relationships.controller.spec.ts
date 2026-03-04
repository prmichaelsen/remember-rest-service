import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppRelationshipsController } from './app-relationships.controller.js';
import { WEAVIATE_CLIENT, LOGGER } from '../../core/core.providers.js';

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
});
