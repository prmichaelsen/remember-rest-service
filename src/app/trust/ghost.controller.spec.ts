import { Test } from '@nestjs/testing';
import { GhostSearchController } from './ghost.controller.js';
import { WEAVIATE_CLIENT, LOGGER, MEMORY_INDEX } from '../../core/core.providers.js';

const mockMemoryService = {
  search: jest.fn(),
};

const mockGetGhostConfig = jest.fn();

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
  FirestoreGhostConfigProvider: jest.fn().mockImplementation(() => ({
    getGhostConfig: mockGetGhostConfig,
  })),
  resolveAccessorTrustLevel: jest.fn().mockReturnValue(0.5),
  formatMemoryForPrompt: jest.fn().mockImplementation((raw, trustLevel) => ({
    memory_id: raw.id ?? raw.memory_id ?? 'unknown',
    content: raw.content ?? '',
    trust_tier: 'Partial Access',
  })),
  getTrustLevelLabel: jest.fn().mockReturnValue('Partial Access'),
}));

jest.mock('@prmichaelsen/remember-core/types', () => ({
  DEFAULT_GHOST_CONFIG: {
    enabled: false,
    public_ghost_enabled: false,
    default_friend_trust: 0.25,
    default_public_trust: 0,
    per_user_trust: {},
    blocked_users: [],
    enforcement_mode: 'query',
  },
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

describe('GhostSearchController', () => {
  let controller: GhostSearchController;
  const userId = 'caller-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [GhostSearchController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
      ],
    }).compile();

    controller = module.get(GhostSearchController);
  });

  describe('searchAsGhost', () => {
    it('should resolve trust and search owner memories', async () => {
      mockGetGhostConfig.mockResolvedValue({
        enabled: true,
        per_user_trust: { 'caller-user-123': 0.5 },
        default_friend_trust: 0.25,
        default_public_trust: 0,
        blocked_users: [],
      });

      mockMemoryService.search.mockResolvedValue({
        memories: [
          {
            id: 'mem-1',
            memory_id: 'mem-1',
            content: 'Secret note',
            tags: ['private'],
          },
        ],
        total: 1,
      });

      const result = await controller.searchAsGhost(userId, {
        owner_user_id: 'owner-user-456',
        query: 'notes',
      });

      expect(result).toEqual({
        memories: [
          {
            memory_id: 'mem-1',
            trust_tier: 'partial_access',
            content: 'Secret note',
            tags: ['private'],
            access_level: 'Partial Access',
          },
        ],
        total: 1,
        offset: 0,
        limit: 10,
        hasMore: false,
        trust_tier: 'partial_access',
      });

      // Should create MemoryService for the owner, not the caller
      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith(
        'Memory_users_owner-user-456',
      );

      // Should search with ghost_context
      expect(mockMemoryService.search).toHaveBeenCalledWith({
        query: 'notes',
        limit: 10,
        offset: 0,
        ghost_context: {
          accessor_trust_level: 0.5,
          owner_user_id: 'owner-user-456',
        },
      });
    });

    it('should use default config when ghost is not configured', async () => {
      mockGetGhostConfig.mockResolvedValue(null);
      mockMemoryService.search.mockResolvedValue({
        memories: [],
        total: 0,
      });

      const result = await controller.searchAsGhost(userId, {
        owner_user_id: 'owner-2',
        query: 'anything',
      });

      expect(result.memories).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use custom limit and offset', async () => {
      mockGetGhostConfig.mockResolvedValue(null);
      mockMemoryService.search.mockResolvedValue({
        memories: [],
        total: 50,
      });

      const result = await controller.searchAsGhost(userId, {
        owner_user_id: 'owner-3',
        query: 'search',
        limit: 5,
        offset: 20,
      });

      expect(result.limit).toBe(5);
      expect(result.offset).toBe(20);
      expect(result.hasMore).toBe(true);
      expect(mockMemoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, offset: 20 }),
      );
    });

    it('should create MemoryService for the owner user', async () => {
      const { MemoryService: MockedMemory } =
        jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedMemory.mockClear();
      mockGetGhostConfig.mockResolvedValue(null);
      mockMemoryService.search.mockResolvedValue({ memories: [], total: 0 });

      await controller.searchAsGhost(userId, {
        owner_user_id: 'owner-x',
        query: 'test',
      });

      expect(MockedMemory).toHaveBeenCalledWith(
        mockCollection,
        'owner-x',
        mockLogger,
        {
          memoryIndex: mockMemoryIndex,
          weaviateClient: mockWeaviateClient,
        },
      );
    });
  });
});
