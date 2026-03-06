import { Test } from '@nestjs/testing';
import { SpacesController } from './spaces.controller.js';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MODERATION_CLIENT } from '../core/core.providers.js';

const mockSpaceService = {
  publish: jest.fn(),
  retract: jest.fn(),
  revise: jest.fn(),
  moderate: jest.fn(),
  search: jest.fn(),
  query: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
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

const mockModerationClient = {
  moderate: jest.fn().mockResolvedValue({ pass: true, reason: '' }),
};

describe('SpacesController', () => {
  let controller: SpacesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [SpacesController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: CONFIRMATION_TOKEN_SERVICE, useValue: mockConfirmationTokenService },
        { provide: MODERATION_CLIENT, useValue: mockModerationClient },
      ],
    }).compile();

    controller = module.get(SpacesController);
  });

  describe('publish', () => {
    it('should publish a memory to spaces', async () => {
      const dto = { memory_id: 'mem-1', spaces: ['the_void'] };
      const expected = { token: 'tok-123' };
      mockSpaceService.publish.mockResolvedValue(expected);

      const result = await controller.publish(userId, dto);

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith(`Memory_users_${userId}`);
      expect(mockSpaceService.publish).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('retract', () => {
    it('should retract a memory from spaces', async () => {
      const dto = { memory_id: 'mem-1', spaces: ['the_void'] };
      const expected = { token: 'tok-456' };
      mockSpaceService.retract.mockResolvedValue(expected);

      const result = await controller.retract(userId, dto);

      expect(mockSpaceService.retract).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('revise', () => {
    it('should revise a published memory', async () => {
      const dto = { memory_id: 'mem-1' };
      const expected = { token: 'tok-789' };
      mockSpaceService.revise.mockResolvedValue(expected);

      const result = await controller.revise(userId, dto);

      expect(mockSpaceService.revise).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('moderate', () => {
    it('should moderate a memory in a space', async () => {
      const dto = { memory_id: 'mem-1', space_id: 'the_void', action: 'approve' as const };
      const expected = {
        memory_id: 'mem-1',
        action: 'approve',
        moderation_status: 'approved',
        moderated_by: userId,
        moderated_at: '2026-01-01T00:00:00Z',
        location: 'spaces/the_void',
      };
      mockSpaceService.moderate.mockResolvedValue(expected);

      const result = await controller.moderate(userId, dto);

      expect(mockSpaceService.moderate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('search', () => {
    it('should search across spaces', async () => {
      const dto = { query: 'find stuff', spaces: ['the_void'] };
      const expected = { spaces_searched: ['the_void'], groups_searched: [], memories: [], total: 0, offset: 0, limit: 10 };
      mockSpaceService.search.mockResolvedValue(expected);

      const result = await controller.search(userId, dto);

      expect(mockSpaceService.search).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('query', () => {
    it('should query spaces semantically', async () => {
      const dto = { question: 'What is AI?', spaces: ['the_void'] };
      const expected = { question: 'What is AI?', spaces_queried: ['the_void'], memories: [], total: 0 };
      mockSpaceService.query.mockResolvedValue(expected);

      const result = await controller.query(userId, dto);

      expect(mockSpaceService.query).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('per-user collection', () => {
    it('should create SpaceService with weaviateClient, user collection, and confirmationTokenService', async () => {
      const { SpaceService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedService.mockClear();
      mockSpaceService.publish.mockResolvedValue({ token: 'x' });

      await controller.publish('user-a', { memory_id: 'mem-1' });

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-a');
      expect(MockedService).toHaveBeenCalledWith(
        mockWeaviateClient,
        mockCollection,
        'user-a',
        mockConfirmationTokenService,
        mockLogger,
        { moderationClient: mockModerationClient },
      );
    });
  });
});
