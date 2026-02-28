import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ProfilesController } from './profiles.controller.js';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE } from '../../core/core.providers.js';

const mockMemoryService = {
  create: jest.fn(),
  update: jest.fn(),
  search: jest.fn(),
};

const mockSpaceService = {
  publish: jest.fn(),
  retract: jest.fn(),
  revise: jest.fn(),
  confirm: jest.fn(),
  search: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
  SpaceService: jest.fn().mockImplementation(() => mockSpaceService),
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

const mockConfirmationTokenService = {};

describe('ProfilesController', () => {
  let controller: ProfilesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: CONFIRMATION_TOKEN_SERVICE, useValue: mockConfirmationTokenService },
      ],
    }).compile();

    controller = module.get(ProfilesController);
  });

  describe('createAndPublish', () => {
    it('should create a memory and publish to profiles space', async () => {
      mockSpaceService.search.mockResolvedValue({ memories: [] });
      mockMemoryService.create.mockResolvedValue({ memory_id: 'mem-1' });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-1' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'profiles:test-user-123:mem-1' });

      const result = await controller.createAndPublish(userId, {
        display_name: 'Alice',
        bio: 'Engineer',
        tags: ['dev'],
      });

      expect(result).toEqual({
        memory_id: 'mem-1',
        space_id: 'profiles',
        composite_id: 'profiles:test-user-123:mem-1',
      });
      expect(mockMemoryService.create).toHaveBeenCalledWith({
        content: 'Name: Alice\nBio: Engineer\nTags: dev',
        type: 'profile',
        tags: ['dev'],
      });
      expect(mockSpaceService.publish).toHaveBeenCalledWith({
        memory_id: 'mem-1',
        spaces: ['profiles'],
      });
      expect(mockSpaceService.confirm).toHaveBeenCalledWith({ token: 'tok-1' });
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockSpaceService.search.mockResolvedValue({
        memories: [{ id: 'existing-mem' }],
      });

      await expect(
        controller.createAndPublish(userId, { display_name: 'Alice' }),
      ).rejects.toThrow(ConflictException);

      expect(mockMemoryService.create).not.toHaveBeenCalled();
    });

    it('should use empty tags when not provided', async () => {
      mockSpaceService.search.mockResolvedValue({ memories: [] });
      mockMemoryService.create.mockResolvedValue({ memory_id: 'mem-2' });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-2' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'profiles:test-user-123:mem-2' });

      await controller.createAndPublish(userId, { display_name: 'Bob' });

      expect(mockMemoryService.create).toHaveBeenCalledWith({
        content: 'Name: Bob',
        type: 'profile',
        tags: [],
      });
    });
  });

  describe('updateAndRepublish', () => {
    it('should update memory and revise in profiles space', async () => {
      mockMemoryService.update.mockResolvedValue({});
      mockSpaceService.revise.mockResolvedValue({ token: 'tok-3' });
      mockSpaceService.confirm.mockResolvedValue({});

      const result = await controller.updateAndRepublish(userId, 'mem-1', {
        display_name: 'Alice Updated',
        bio: 'Senior Engineer',
        tags: ['dev', 'lead'],
      });

      expect(result).toEqual({
        memory_id: 'mem-1',
        composite_id: undefined,
      });
      expect(mockMemoryService.update).toHaveBeenCalledWith({
        memory_id: 'mem-1',
        content: 'Name: Alice Updated\nBio: Senior Engineer\nTags: dev, lead',
        tags: ['dev', 'lead'],
      });
      expect(mockSpaceService.revise).toHaveBeenCalledWith({ memory_id: 'mem-1' });
      expect(mockSpaceService.confirm).toHaveBeenCalledWith({ token: 'tok-3' });
    });

    it('should handle update with only tags', async () => {
      mockMemoryService.update.mockResolvedValue({});
      mockSpaceService.revise.mockResolvedValue({ token: 'tok-4' });
      mockSpaceService.confirm.mockResolvedValue({});

      await controller.updateAndRepublish(userId, 'mem-1', {
        tags: ['new-tag'],
      });

      expect(mockMemoryService.update).toHaveBeenCalledWith({
        memory_id: 'mem-1',
        content: undefined,
        tags: ['new-tag'],
      });
    });
  });

  describe('retract', () => {
    it('should retract from profiles space', async () => {
      mockSpaceService.retract.mockResolvedValue({ token: 'tok-5' });
      mockSpaceService.confirm.mockResolvedValue({});

      const result = await controller.retract(userId, 'mem-1');

      expect(result).toEqual({ retracted: true });
      expect(mockSpaceService.retract).toHaveBeenCalledWith({
        memory_id: 'mem-1',
        spaces: ['profiles'],
      });
      expect(mockSpaceService.confirm).toHaveBeenCalledWith({ token: 'tok-5' });
    });
  });

  describe('search', () => {
    it('should search profiles space and return enriched results', async () => {
      mockSpaceService.search.mockResolvedValue({
        memories: [
          {
            id: 'mem-1',
            content: 'Name: Alice\nBio: Engineer',
            tags: ['dev'],
            composite_id: 'profiles:user-a:mem-1',
          },
        ],
        total: 1,
        offset: 0,
        limit: 10,
      });

      const result = await controller.search(userId, {
        query: 'engineer',
      });

      expect(result).toEqual({
        profiles: [
          {
            user_id: 'user-a',
            display_name: 'Alice',
            bio: 'Engineer',
            tags: ['dev'],
            similarity: 0,
            memory_id: 'mem-1',
            composite_id: 'profiles:user-a:mem-1',
          },
        ],
        total: 1,
        offset: 0,
        limit: 10,
        hasMore: false,
      });
      expect(mockSpaceService.search).toHaveBeenCalledWith({
        query: 'engineer',
        spaces: ['profiles'],
        content_type: 'profile',
        limit: 10,
        offset: 0,
      });
    });

    it('should use custom limit and offset', async () => {
      mockSpaceService.search.mockResolvedValue({
        memories: [],
        total: 50,
        offset: 20,
        limit: 5,
      });

      const result = await controller.search(userId, {
        query: 'test',
        limit: 5,
        offset: 20,
      });

      expect(result.hasMore).toBe(true);
      expect(mockSpaceService.search).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, offset: 20 }),
      );
    });

    it('should handle profiles without composite_id', async () => {
      mockSpaceService.search.mockResolvedValue({
        memories: [
          {
            id: 'mem-2',
            content: 'Name: Bob',
            tags: [],
            user_id: 'user-b',
          },
        ],
        total: 1,
        offset: 0,
        limit: 10,
      });

      const result = await controller.search(userId, { query: 'bob' });

      expect(result.profiles[0].user_id).toBe('user-b');
      expect(result.profiles[0].display_name).toBe('Bob');
      expect(result.profiles[0].bio).toBeUndefined();
    });
  });

  describe('per-user collection', () => {
    it('should create services scoped to the authenticated user', async () => {
      const { MemoryService: MockedMemory, SpaceService: MockedSpace } =
        jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedMemory.mockClear();
      MockedSpace.mockClear();
      mockSpaceService.search.mockResolvedValue({ memories: [] });
      mockMemoryService.create.mockResolvedValue({ memory_id: 'x' });
      mockSpaceService.publish.mockResolvedValue({ token: 't' });
      mockSpaceService.confirm.mockResolvedValue({});

      await controller.createAndPublish('user-x', { display_name: 'X' });

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-x');
      expect(MockedMemory).toHaveBeenCalledWith(mockCollection, 'user-x', mockLogger);
      expect(MockedSpace).toHaveBeenCalledWith(
        mockWeaviateClient,
        mockCollection,
        'user-x',
        mockConfirmationTokenService,
        mockLogger,
      );
    });
  });
});
