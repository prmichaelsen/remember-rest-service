import { Test } from '@nestjs/testing';
import { RelationshipsController } from './relationships.controller.js';
import { WEAVIATE_CLIENT, LOGGER } from '../core/core.providers.js';

const mockRelationshipService = {
  create: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  reorder: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
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

describe('RelationshipsController', () => {
  let controller: RelationshipsController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [RelationshipsController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(RelationshipsController);
  });

  describe('create', () => {
    it('should create a relationship', async () => {
      const dto = {
        memory_ids: ['mem-1', 'mem-2'],
        relationship_type: 'related_to',
        observation: 'These memories are related',
      };
      const expected = { relationship_id: 'rel-1', memory_ids: ['mem-1', 'mem-2'], created_at: '2026-01-01T00:00:00Z' };
      mockRelationshipService.create.mockResolvedValue(expected);

      const result = await controller.create(userId, dto);

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith(`Memory_users_${userId}`);
      expect(mockRelationshipService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass optional fields', async () => {
      const dto = {
        memory_ids: ['mem-1', 'mem-2'],
        relationship_type: 'caused_by',
        observation: 'Causal relationship',
        strength: 0.9,
        confidence: 0.8,
        tags: ['causal'],
        context_summary: 'Context',
        context_conversation_id: 'conv-1',
      };
      mockRelationshipService.create.mockResolvedValue({ relationship_id: 'rel-2', memory_ids: ['mem-1', 'mem-2'], created_at: '' });

      await controller.create(userId, dto);

      expect(mockRelationshipService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('search', () => {
    it('should search relationships', async () => {
      const dto = { query: 'find relationships' };
      const expected = { relationships: [], total: 0, offset: 0, limit: 10 };
      mockRelationshipService.search.mockResolvedValue(expected);

      const result = await controller.search(userId, dto);

      expect(mockRelationshipService.search).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass search filters', async () => {
      const dto = {
        query: 'find',
        relationship_types: ['related_to'],
        strength_min: 0.5,
        confidence_min: 0.7,
        tags: ['important'],
        limit: 20,
        offset: 5,
      };
      mockRelationshipService.search.mockResolvedValue({ relationships: [], total: 0, offset: 5, limit: 20 });

      await controller.search(userId, dto);

      expect(mockRelationshipService.search).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a relationship by id', async () => {
      const dto = { observation: 'Updated observation' };
      const relId = 'rel-1';
      const expected = { relationship_id: relId, updated_at: '2026-01-01T00:00:00Z', version: 2, updated_fields: ['observation'] };
      mockRelationshipService.update.mockResolvedValue(expected);

      const result = await controller.update(userId, relId, dto);

      expect(mockRelationshipService.update).toHaveBeenCalledWith({ observation: 'Updated observation', relationship_id: relId });
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('should delete a relationship', async () => {
      const relId = 'rel-1';
      const expected = { relationship_id: relId, memories_updated: 2 };
      mockRelationshipService.delete.mockResolvedValue(expected);

      const result = await controller.delete(userId, relId);

      expect(mockRelationshipService.delete).toHaveBeenCalledWith({ relationship_id: relId });
      expect(result).toEqual(expected);
    });
  });

  describe('reorder', () => {
    const reorderResult = {
      relationship_id: 'rel-1',
      member_order: { 'mem-1': 1, 'mem-2': 0 },
      version: 2,
      updated_at: '2026-03-13T00:00:00Z',
    };

    it('should reorder with move_to_index', async () => {
      const dto = {
        operation: { type: 'move_to_index' as const, memory_id: 'mem-1', index: 0 },
        version: 1,
      };
      mockRelationshipService.reorder.mockResolvedValue(reorderResult);

      const result = await controller.reorder(userId, 'rel-1', dto);

      expect(mockRelationshipService.reorder).toHaveBeenCalledWith({
        relationship_id: 'rel-1',
        operation: { type: 'move_to_index', memory_id: 'mem-1', index: 0 },
        version: 1,
      });
      expect(result).toEqual(reorderResult);
    });

    it('should reorder with swap', async () => {
      const dto = {
        operation: { type: 'swap' as const, memory_id_a: 'mem-1', memory_id_b: 'mem-2' },
        version: 1,
      };
      mockRelationshipService.reorder.mockResolvedValue(reorderResult);

      await controller.reorder(userId, 'rel-1', dto);

      expect(mockRelationshipService.reorder).toHaveBeenCalledWith({
        relationship_id: 'rel-1',
        operation: { type: 'swap', memory_id_a: 'mem-1', memory_id_b: 'mem-2' },
        version: 1,
      });
    });

    it('should reorder with set_order', async () => {
      const dto = {
        operation: { type: 'set_order' as const, ordered_memory_ids: ['mem-2', 'mem-1'] },
        version: 1,
      };
      mockRelationshipService.reorder.mockResolvedValue(reorderResult);

      await controller.reorder(userId, 'rel-1', dto);

      expect(mockRelationshipService.reorder).toHaveBeenCalledWith({
        relationship_id: 'rel-1',
        operation: { type: 'set_order', ordered_memory_ids: ['mem-2', 'mem-1'] },
        version: 1,
      });
    });

    it('should reorder with move_before', async () => {
      const dto = {
        operation: { type: 'move_before' as const, memory_id: 'mem-2', before: 'mem-1' },
        version: 1,
      };
      mockRelationshipService.reorder.mockResolvedValue(reorderResult);

      await controller.reorder(userId, 'rel-1', dto);

      expect(mockRelationshipService.reorder).toHaveBeenCalledWith({
        relationship_id: 'rel-1',
        operation: { type: 'move_before', memory_id: 'mem-2', before: 'mem-1' },
        version: 1,
      });
    });

    it('should reorder with move_after', async () => {
      const dto = {
        operation: { type: 'move_after' as const, memory_id: 'mem-1', after: 'mem-2' },
        version: 1,
      };
      mockRelationshipService.reorder.mockResolvedValue(reorderResult);

      await controller.reorder(userId, 'rel-1', dto);

      expect(mockRelationshipService.reorder).toHaveBeenCalledWith({
        relationship_id: 'rel-1',
        operation: { type: 'move_after', memory_id: 'mem-1', after: 'mem-2' },
        version: 1,
      });
    });

    it('should return reorder result with member_order and version', async () => {
      const dto = {
        operation: { type: 'move_to_index' as const, memory_id: 'mem-1', index: 0 },
        version: 3,
      };
      const expected = {
        relationship_id: 'rel-1',
        member_order: { 'mem-1': 0, 'mem-2': 1, 'mem-3': 2 },
        version: 4,
        updated_at: '2026-03-13T12:00:00Z',
      };
      mockRelationshipService.reorder.mockResolvedValue(expected);

      const result = await controller.reorder(userId, 'rel-1', dto);

      expect(result.member_order).toEqual({ 'mem-1': 0, 'mem-2': 1, 'mem-3': 2 });
      expect(result.version).toBe(4);
      expect(result.updated_at).toBe('2026-03-13T12:00:00Z');
    });
  });

  describe('per-user collection', () => {
    it('should create service with correct user collection', async () => {
      const { RelationshipService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedService.mockClear();
      mockRelationshipService.create.mockResolvedValue({ relationship_id: 'x', memory_ids: [], created_at: '' });

      await controller.create('user-a', { memory_ids: ['m1', 'm2'], relationship_type: 'r', observation: 'o' });
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-a');
      expect(MockedService).toHaveBeenCalledWith(mockCollection, 'user-a', mockLogger);
    });
  });
});
