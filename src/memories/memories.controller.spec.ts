import { Test } from '@nestjs/testing';
import { MemoriesController } from './memories.controller.js';
import { WEAVIATE_CLIENT, LOGGER } from '../core/core.providers.js';

const mockMemoryService = {
  create: jest.fn(),
  search: jest.fn(),
  findSimilar: jest.fn(),
  query: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
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

describe('MemoriesController', () => {
  let controller: MemoriesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [MemoriesController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(MemoriesController);
  });

  describe('create', () => {
    it('should create a memory and return the result', async () => {
      const dto = { content: 'Test memory content' };
      const expected = { memory_id: 'mem-1', created_at: '2026-01-01T00:00:00Z' };
      mockMemoryService.create.mockResolvedValue(expected);

      const result = await controller.create(userId, dto);

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith(`Memory_users_${userId}`);
      expect(mockMemoryService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass all optional fields to service', async () => {
      const dto = {
        content: 'Test',
        title: 'My Memory',
        type: 'note',
        weight: 0.8,
        trust: 0.5,
        tags: ['tag1', 'tag2'],
        references: ['https://example.com'],
        template_id: 'tmpl-1',
        parent_id: 'parent-1',
        thread_root_id: 'root-1',
        moderation_flags: ['flagged'],
        context_summary: 'Context',
        context_conversation_id: 'conv-1',
      };
      mockMemoryService.create.mockResolvedValue({ memory_id: 'mem-2', created_at: '2026-01-01T00:00:00Z' });

      await controller.create(userId, dto);

      expect(mockMemoryService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('search', () => {
    it('should search memories with query', async () => {
      const dto = { query: 'find something' };
      const expected = { memories: [], total: 0, offset: 0, limit: 10 };
      mockMemoryService.search.mockResolvedValue(expected);

      const result = await controller.search(userId, dto);

      expect(mockMemoryService.search).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass filters and options to search', async () => {
      const dto = {
        query: 'find',
        alpha: 0.5,
        limit: 20,
        offset: 10,
        filters: { types: ['note'], tags: ['important'] },
        include_relationships: false,
        deleted_filter: 'include',
      };
      mockMemoryService.search.mockResolvedValue({ memories: [], total: 0, offset: 10, limit: 20 });

      await controller.search(userId, dto);

      expect(mockMemoryService.search).toHaveBeenCalledWith(dto);
    });
  });

  describe('findSimilar', () => {
    it('should find similar by memory_id', async () => {
      const dto = { memory_id: 'mem-1' };
      const expected = { similar_memories: [], total: 0 };
      mockMemoryService.findSimilar.mockResolvedValue(expected);

      const result = await controller.findSimilar(userId, dto);

      expect(mockMemoryService.findSimilar).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should find similar by text', async () => {
      const dto = { text: 'some text to compare' };
      const expected = { similar_memories: [{ id: 'mem-2', similarity: 0.9 }], total: 1 };
      mockMemoryService.findSimilar.mockResolvedValue(expected);

      const result = await controller.findSimilar(userId, dto);

      expect(mockMemoryService.findSimilar).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('query', () => {
    it('should query memories semantically', async () => {
      const dto = { query: 'what do I know about cats' };
      const expected = { memories: [{ id: 'mem-1', relevance: 0.85 }], total: 1 };
      mockMemoryService.query.mockResolvedValue(expected);

      const result = await controller.query(userId, dto);

      expect(mockMemoryService.query).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should update a memory by id', async () => {
      const dto = { content: 'Updated content' };
      const memoryId = 'mem-1';
      const expected = { memory_id: memoryId, updated_at: '2026-01-01T00:00:00Z', version: 2, updated_fields: ['content'] };
      mockMemoryService.update.mockResolvedValue(expected);

      const result = await controller.update(userId, memoryId, dto);

      expect(mockMemoryService.update).toHaveBeenCalledWith({ ...dto, memory_id: memoryId });
      expect(result).toEqual(expected);
    });

    it('should merge id param with body fields', async () => {
      const dto = { weight: 0.9, tags: ['updated'] };
      const memoryId = 'mem-2';
      mockMemoryService.update.mockResolvedValue({ memory_id: memoryId, updated_at: '2026-01-01T00:00:00Z', version: 3, updated_fields: ['weight', 'tags'] });

      await controller.update(userId, memoryId, dto);

      expect(mockMemoryService.update).toHaveBeenCalledWith({ weight: 0.9, tags: ['updated'], memory_id: memoryId });
    });
  });

  describe('delete', () => {
    it('should soft delete a memory', async () => {
      const dto = { reason: 'No longer needed' };
      const memoryId = 'mem-1';
      const expected = { memory_id: memoryId, deleted_at: '2026-01-01T00:00:00Z', orphaned_relationship_ids: [] };
      mockMemoryService.delete.mockResolvedValue(expected);

      const result = await controller.delete(userId, memoryId, dto);

      expect(mockMemoryService.delete).toHaveBeenCalledWith({ memory_id: memoryId, reason: 'No longer needed' });
      expect(result).toEqual(expected);
    });

    it('should delete without reason', async () => {
      const dto = {};
      const memoryId = 'mem-2';
      const expected = { memory_id: memoryId, deleted_at: '2026-01-01T00:00:00Z', orphaned_relationship_ids: ['rel-1'] };
      mockMemoryService.delete.mockResolvedValue(expected);

      const result = await controller.delete(userId, memoryId, dto as any);

      expect(mockMemoryService.delete).toHaveBeenCalledWith({ memory_id: memoryId, reason: undefined });
      expect(result).toEqual(expected);
    });
  });

  describe('per-user collection', () => {
    it('should create a new MemoryService with the correct user collection for each request', async () => {
      const { MemoryService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedService.mockClear();
      mockMemoryService.create.mockResolvedValue({ memory_id: 'x', created_at: '' });

      await controller.create('user-a', { content: 'a' });
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-a');
      expect(MockedService).toHaveBeenCalledWith(mockCollection, 'user-a', mockLogger);

      await controller.create('user-b', { content: 'b' });
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-b');
      expect(MockedService).toHaveBeenCalledWith(mockCollection, 'user-b', mockLogger);
    });
  });
});
