import { Test } from '@nestjs/testing';
import { MemoriesController } from './memories.controller.js';
import { WEAVIATE_CLIENT, LOGGER, HAIKU_CLIENT, JOB_SERVICE, MEMORY_INDEX, EXTRACTOR_REGISTRY } from '../core/core.providers.js';

const mockMemoryService = {
  create: jest.fn(),
  search: jest.fn(),
  findSimilar: jest.fn(),
  query: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  byTime: jest.fn(),
  byRating: jest.fn(),
  byDiscovery: jest.fn(),
  byCurated: jest.fn(),
  byRecommendation: jest.fn(),
  byProperty: jest.fn(),
  byBroad: jest.fn(),
  byRandom: jest.fn(),
};

const mockRatingService = {
  rate: jest.fn(),
  retract: jest.fn(),
  getUserRating: jest.fn(),
};

const mockRelationshipService = {
  create: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockJobService = {
  create: jest.fn(),
  getStatus: jest.fn(),
  cancel: jest.fn(),
  cleanupExpired: jest.fn(),
};

const mockWorkerExecute = jest.fn().mockResolvedValue(undefined);
const MockImportJobWorker = jest.fn().mockImplementation(() => ({
  execute: mockWorkerExecute,
}));

const mockValidateImportItems = jest.fn().mockReturnValue([]);

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
  RelationshipService: jest.fn().mockImplementation(() => mockRelationshipService),
  RatingService: jest.fn().mockImplementation(() => mockRatingService),
  get ImportJobWorker() { return MockImportJobWorker; },
  DEFAULT_TTL_HOURS: { import: 1, rem_cycle: 24 },
  get validateImportItems() { return mockValidateImportItems; },
}));

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  ensureUserCollection: jest.fn().mockResolvedValue(false),
}));

const mockSearchByTimeSlice = jest.fn();
const mockSearchByDensitySlice = jest.fn();
jest.mock('@prmichaelsen/remember-core/search', () => ({
  searchByTimeSlice: (...args: unknown[]) => mockSearchByTimeSlice(...args),
  searchByDensitySlice: (...args: unknown[]) => mockSearchByDensitySlice(...args),
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

const mockHaikuClient = {
  validateCluster: jest.fn(),
  extractFeatures: jest.fn(),
};

const mockMemoryIndex = {
  index: jest.fn(),
  lookup: jest.fn(),
};

const mockExtractorRegistry = {
  getExtractor: jest.fn(),
  getSupportedMimeTypes: jest.fn().mockReturnValue(['text/plain', 'text/html', 'application/pdf']),
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
        { provide: HAIKU_CLIENT, useValue: mockHaikuClient },
        { provide: JOB_SERVICE, useValue: mockJobService },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
        { provide: EXTRACTOR_REGISTRY, useValue: mockExtractorRegistry },
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
        trust: 3,
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

  describe('byTimeSlice', () => {
    it('should call searchByTimeSlice with the MemoryService and return result', async () => {
      const dto = { query: 'important meetings' } as any;
      const expected = { memories: [{ id: 'mem-1' }], total: 1 };
      mockSearchByTimeSlice.mockResolvedValue(expected);

      const result = await controller.byTimeSlice(userId, dto);

      expect(mockSearchByTimeSlice).toHaveBeenCalledWith(
        mockMemoryService,
        'important meetings',
        { limit: 10, offset: 0, direction: 'desc', filters: undefined },
      );
      expect(result).toEqual(expected);
    });

    it('should pass direction, filters, and pagination to searchByTimeSlice', async () => {
      const dto = {
        query: 'search text',
        limit: 50,
        offset: 10,
        direction: 'asc' as const,
        filters: { types: ['note'] },
      } as any;
      const expected = { memories: [], total: 0 };
      mockSearchByTimeSlice.mockResolvedValue(expected);

      const result = await controller.byTimeSlice(userId, dto);

      expect(mockSearchByTimeSlice).toHaveBeenCalledWith(
        mockMemoryService,
        'search text',
        { limit: 50, offset: 10, direction: 'asc', filters: { types: ['note'] } },
      );
      expect(result).toEqual(expected);
    });

    it('should use defaults when optional fields are omitted', async () => {
      const dto = { query: 'test' } as any;
      mockSearchByTimeSlice.mockResolvedValue({ memories: [], total: 0 });

      await controller.byTimeSlice(userId, dto);

      expect(mockSearchByTimeSlice).toHaveBeenCalledWith(
        mockMemoryService,
        'test',
        { limit: 10, offset: 0, direction: 'desc', filters: undefined },
      );
    });
  });

  describe('byDensitySlice', () => {
    it('should call searchByDensitySlice with the MemoryService and return result', async () => {
      const dto = { query: 'important meetings' } as any;
      const expected = { memories: [{ id: 'mem-1' }], total: 1 };
      mockSearchByDensitySlice.mockResolvedValue(expected);

      const result = await controller.byDensitySlice(userId, dto);

      expect(mockSearchByDensitySlice).toHaveBeenCalledWith(
        mockMemoryService,
        'important meetings',
        { limit: 10, offset: 0, direction: 'desc', filters: undefined },
      );
      expect(result).toEqual(expected);
    });

    it('should pass direction, filters, and pagination to searchByDensitySlice', async () => {
      const dto = {
        query: 'search text',
        limit: 50,
        offset: 10,
        direction: 'asc' as const,
        filters: { types: ['note'] },
      } as any;
      const expected = { memories: [], total: 0 };
      mockSearchByDensitySlice.mockResolvedValue(expected);

      const result = await controller.byDensitySlice(userId, dto);

      expect(mockSearchByDensitySlice).toHaveBeenCalledWith(
        mockMemoryService,
        'search text',
        { limit: 50, offset: 10, direction: 'asc', filters: { types: ['note'] } },
      );
      expect(result).toEqual(expected);
    });

    it('should use defaults when optional fields are omitted', async () => {
      const dto = { query: 'test' } as any;
      mockSearchByDensitySlice.mockResolvedValue({ memories: [], total: 0 });

      await controller.byDensitySlice(userId, dto);

      expect(mockSearchByDensitySlice).toHaveBeenCalledWith(
        mockMemoryService,
        'test',
        { limit: 10, offset: 0, direction: 'desc', filters: undefined },
      );
    });
  });

  describe('per-user collection', () => {
    it('should create a new MemoryService with the correct user collection for each request', async () => {
      const { MemoryService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedService.mockClear();
      mockMemoryService.create.mockResolvedValue({ memory_id: 'x', created_at: '' });

      await controller.create('user-a', { content: 'a' });
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-a');
      expect(MockedService).toHaveBeenCalledWith(mockCollection, 'user-a', mockLogger, {
        memoryIndex: mockMemoryIndex,
        weaviateClient: mockWeaviateClient,
      });

      await controller.create('user-b', { content: 'b' });
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-b');
      expect(MockedService).toHaveBeenCalledWith(mockCollection, 'user-b', mockLogger, {
        memoryIndex: mockMemoryIndex,
        weaviateClient: mockWeaviateClient,
      });
    });
  });

  describe('rateMemory', () => {
    it('should call RatingService.rate with correct args', async () => {
      const expected = { previousRating: null, newRating: 4, ratingCount: 1, ratingAvg: null };
      mockRatingService.rate.mockResolvedValue(expected);

      const result = await controller.rateMemory(userId, 'mem-1', { rating: 4 });

      expect(mockRatingService.rate).toHaveBeenCalledWith({
        memoryId: 'mem-1',
        userId,
        rating: 4,
      });
      expect(result).toEqual(expected);
    });

    it('should handle rating update (change)', async () => {
      const expected = { previousRating: 3, newRating: 5, ratingCount: 1, ratingAvg: null };
      mockRatingService.rate.mockResolvedValue(expected);

      const result = await controller.rateMemory(userId, 'mem-1', { rating: 5 });

      expect(result.previousRating).toBe(3);
      expect(result.newRating).toBe(5);
    });
  });

  describe('retractRating', () => {
    it('should call RatingService.retract and return void', async () => {
      mockRatingService.retract.mockResolvedValue(undefined);

      const result = await controller.retractRating(userId, 'mem-1');

      expect(mockRatingService.retract).toHaveBeenCalledWith('mem-1', userId);
      expect(result).toBeUndefined();
    });
  });

  describe('getMyRating', () => {
    it('should return rating when it exists', async () => {
      const expected = { rating: 4, created_at: '2026-03-05T00:00:00Z', updated_at: '2026-03-05T00:00:00Z' };
      mockRatingService.getUserRating.mockResolvedValue(expected);

      const result = await controller.getMyRating(userId, 'mem-1');

      expect(mockRatingService.getUserRating).toHaveBeenCalledWith('mem-1', userId);
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException when no rating exists', async () => {
      mockRatingService.getUserRating.mockResolvedValue(null);

      await expect(controller.getMyRating(userId, 'mem-1')).rejects.toThrow('No rating found');
    });
  });

  describe('byRating', () => {
    it('should call MemoryService.byRating with correct args', async () => {
      const dto = { direction: 'desc' as const, limit: 20, offset: 0 };
      const expected = { memories: [{ id: 'mem-1' }], total: 1, offset: 0, limit: 20 };
      mockMemoryService.byRating.mockResolvedValue(expected);

      const result = await controller.byRating(userId, dto);

      expect(mockMemoryService.byRating).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass filters and ghost_context', async () => {
      const dto = {
        filters: { types: ['note'] },
        ghost_context: { accessor_trust_level: 3, owner_user_id: 'owner-1' },
      } as any;
      mockMemoryService.byRating.mockResolvedValue({ memories: [], total: 0, offset: 0, limit: 10 });

      await controller.byRating(userId, dto);

      expect(mockMemoryService.byRating).toHaveBeenCalledWith(dto);
    });
  });

  describe('byDiscovery', () => {
    it('should call MemoryService.byDiscovery with correct args', async () => {
      const dto = { limit: 10, offset: 0 };
      const expected = { memories: [], total: 0, offset: 0, limit: 10 };
      mockMemoryService.byDiscovery.mockResolvedValue(expected);

      const result = await controller.byDiscovery(userId, dto);

      expect(mockMemoryService.byDiscovery).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should pass filters through', async () => {
      const dto = { limit: 5, filters: { types: ['note'] } };
      mockMemoryService.byDiscovery.mockResolvedValue({ memories: [], total: 0, offset: 0, limit: 5 });

      await controller.byDiscovery(userId, dto);

      expect(mockMemoryService.byDiscovery).toHaveBeenCalledWith(dto);
    });
  });

  describe('byCurated', () => {
    it('should call MemoryService.byCurated with correct args', async () => {
      const dto = { limit: 10, direction: 'desc' as const };
      const expected = { memories: [], total: 0, offset: 0, limit: 10 };
      mockMemoryService.byCurated.mockResolvedValue(expected);

      const result = await controller.byCurated(userId, dto);

      expect(mockMemoryService.byCurated).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('byRecommendation', () => {
    it('should call MemoryService.byRecommendation with userId injected', async () => {
      const dto = { limit: 10, offset: 0 };
      const expected = { memories: [], profileSize: 0, insufficientData: true, total: 0, offset: 0, limit: 10 };
      mockMemoryService.byRecommendation.mockResolvedValue(expected);

      const result = await controller.byRecommendation(userId, dto);

      expect(mockMemoryService.byRecommendation).toHaveBeenCalledWith({ ...dto, userId });
      expect(result).toEqual(expected);
    });

    it('should pass query and filters through', async () => {
      const dto = { query: 'test', limit: 5, filters: { types: ['note'] } };
      mockMemoryService.byRecommendation.mockResolvedValue({ memories: [], profileSize: 0, insufficientData: false, total: 0, offset: 0, limit: 5 });

      await controller.byRecommendation(userId, dto);

      expect(mockMemoryService.byRecommendation).toHaveBeenCalledWith({ ...dto, userId });
    });
  });

  describe('byProperty', () => {
    it('should call MemoryService.byProperty with correct args', async () => {
      const dto = { sort_field: 'total_significance', sort_direction: 'desc' as const };
      const expected = { memories: [], total: 0, offset: 0, limit: 50, sort_field: 'total_significance', sort_direction: 'desc' };
      mockMemoryService.byProperty.mockResolvedValue(expected);

      const result = await controller.byProperty(userId, dto);

      expect(mockMemoryService.byProperty).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('byBroad', () => {
    it('should call MemoryService.byBroad with correct args', async () => {
      const dto = { limit: 20 };
      const expected = { results: [], total: 0, offset: 0, limit: 20 };
      mockMemoryService.byBroad.mockResolvedValue(expected);

      const result = await controller.byBroad(userId, dto);

      expect(mockMemoryService.byBroad).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('byRandom', () => {
    it('should call MemoryService.byRandom with correct args', async () => {
      const dto = { limit: 5 };
      const expected = { results: [], total_pool_size: 100 };
      mockMemoryService.byRandom.mockResolvedValue(expected);

      const result = await controller.byRandom(userId, dto);

      expect(mockMemoryService.byRandom).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('importMemories', () => {
    const mockRes = {
      header: jest.fn(),
    } as any;

    beforeEach(() => {
      MockImportJobWorker.mockClear();
      mockWorkerExecute.mockClear();
      mockJobService.create.mockResolvedValue({ id: 'job-123' });
    });

    it('should create job and return 202 with job_id', async () => {
      const dto = {
        items: [{ content: 'Hello world', source_filename: 'notes.txt' }],
        chunk_size: 3000,
        context_conversation_id: 'conv-1',
      };

      const result = await controller.importMemories(userId, dto as any, mockRes);

      expect(mockJobService.create).toHaveBeenCalledWith({
        type: 'import',
        user_id: userId,
        params: { items: dto.items, chunk_size: 3000 },
        ttl_hours: 1,
      });
      expect(result).toEqual({ job_id: 'job-123' });
    });

    it('should set Location header', async () => {
      const dto = { items: [{ content: 'text' }] };

      await controller.importMemories(userId, dto as any, mockRes);

      expect(mockRes.header).toHaveBeenCalledWith('Location', '/api/svc/v1/jobs/job-123');
    });

    it('should construct ImportJobWorker with correct dependencies', async () => {
      const dto = { items: [{ content: 'text' }] };

      await controller.importMemories(userId, dto as any, mockRes);

      expect(MockImportJobWorker).toHaveBeenCalledWith(
        mockJobService,
        mockMemoryService,
        mockRelationshipService,
        mockHaikuClient,
        mockLogger,
        mockExtractorRegistry,
      );
    });

    it('should throw when haikuClient is null', async () => {
      const module = await Test.createTestingModule({
        controllers: [MemoriesController],
        providers: [
          { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
          { provide: LOGGER, useValue: mockLogger },
          { provide: HAIKU_CLIENT, useValue: null },
          { provide: JOB_SERVICE, useValue: mockJobService },
          { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
          { provide: EXTRACTOR_REGISTRY, useValue: mockExtractorRegistry },
        ],
      }).compile();

      const noHaikuController = module.get(MemoriesController);
      const dto = { items: [{ content: 'text' }] };

      await expect(noHaikuController.importMemories(userId, dto as any, mockRes)).rejects.toThrow(
        'Import requires ANTHROPIC_API_KEY to be configured',
      );
    });

    it('should return 400 when validateImportItems finds errors', async () => {
      mockValidateImportItems.mockReturnValueOnce([
        { index: 0, error: 'file_url provided without mime_type' },
      ]);

      const dto = { items: [{ file_url: 'https://example.com/file.pdf' }] };

      await expect(controller.importMemories(userId, dto as any, mockRes)).rejects.toThrow(
        'Invalid import items',
      );
      expect(mockJobService.create).not.toHaveBeenCalled();
    });

    it('should accept file_url items when validation passes', async () => {
      mockValidateImportItems.mockReturnValueOnce([]);

      const dto = {
        items: [{ file_url: 'https://example.com/file.txt', mime_type: 'text/plain' }],
      };

      const result = await controller.importMemories(userId, dto as any, mockRes);

      expect(result).toEqual({ job_id: 'job-123' });
      expect(mockValidateImportItems).toHaveBeenCalledWith(dto.items, mockExtractorRegistry);
    });

    it('should pass extractorRegistry to ImportJobWorker', async () => {
      const dto = { items: [{ content: 'text' }] };

      await controller.importMemories(userId, dto as any, mockRes);

      expect(MockImportJobWorker).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        mockExtractorRegistry,
      );
    });
  });
});
