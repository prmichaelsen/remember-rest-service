import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppMemoriesController } from './app-memories.controller.js';
import { WEAVIATE_CLIENT, LOGGER } from '../../core/core.providers.js';

const mockMemoryService = {
  getById: jest.fn(),
};

const mockRelationshipService = {
  findByMemoryIds: jest.fn(),
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

describe('AppMemoriesController', () => {
  let controller: AppMemoriesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AppMemoriesController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(AppMemoriesController);
  });

  describe('GET /:memoryId', () => {
    it('should return memory without relationships by default', async () => {
      const memory = { id: 'mem-1', title: 'Test', content: 'Hello' };
      mockMemoryService.getById.mockResolvedValue({ memory });

      const result = await controller.getMemory(userId, 'mem-1');

      expect(result).toEqual({ memory, relationships: [] });
      expect(mockMemoryService.getById).toHaveBeenCalledWith('mem-1');
    });

    it('should throw NotFoundException when memory not found', async () => {
      mockMemoryService.getById.mockRejectedValue(new Error('Memory not found: bad-id'));

      await expect(controller.getMemory(userId, 'bad-id')).rejects.toThrow();
    });

    it('should include relationships with previews when includeRelationships=true', async () => {
      const memory = { id: 'mem-1', title: 'Test', content: 'Hello', user_id: userId };
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'Related B', content: 'World', user_id: userId } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', title: 'Related A', content: 'Foo', user_id: userId } });

      mockRelationshipService.findByMemoryIds.mockResolvedValue({
        relationships: [
          {
            id: 'rel-1',
            relationship_type: 'related',
            related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
          },
        ],
        total: 1,
      });

      const result = await controller.getMemory(userId, 'mem-1', 'true');

      expect(result.memory).toEqual(memory);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].member_previews).toHaveLength(2);
      // Sorted alphabetically
      expect(result.relationships[0].member_previews[0].title).toBe('Related A');
      expect(result.relationships[0].member_previews[1].title).toBe('Related B');
    });

    it('should limit relationship memory previews', async () => {
      const memory = { id: 'mem-1', title: 'Test', content: 'Hello' };
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', title: 'A', content: '' } });

      mockRelationshipService.findByMemoryIds.mockResolvedValue({
        relationships: [
          {
            id: 'rel-1',
            related_memory_ids: ['mem-1', 'mem-2', 'mem-3', 'mem-4'],
          },
        ],
        total: 1,
      });

      const result = await controller.getMemory(userId, 'mem-1', 'true', '1');

      // Only 1 preview due to limit
      expect(result.relationships[0].member_previews).toHaveLength(1);
    });

    it('should use content[:80] as title fallback', async () => {
      const longContent = 'A'.repeat(100);
      const memory = { id: 'mem-1', title: 'Test', content: 'Hello' };
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: longContent } });

      mockRelationshipService.findByMemoryIds.mockResolvedValue({
        relationships: [
          { id: 'rel-1', related_memory_ids: ['mem-1', 'mem-2'] },
        ],
        total: 1,
      });

      const result = await controller.getMemory(userId, 'mem-1', 'true');

      expect(result.relationships[0].member_previews[0].title).toBe('A'.repeat(80));
    });
  });
});
