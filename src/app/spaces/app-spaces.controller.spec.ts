import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppSpacesController } from './app-spaces.controller.js';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE, MODERATION_CLIENT, MEMORY_INDEX } from '../../core/core.providers.js';

const mockMemoryService = {
  create: jest.fn(),
};

const mockSpaceService = {
  publish: jest.fn(),
  confirm: jest.fn(),
  getPublishedLocations: jest.fn(),
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

const mockMemoryIndex = {
  index: jest.fn(),
  lookup: jest.fn(),
};

describe('AppSpacesController', () => {
  let controller: AppSpacesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AppSpacesController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: CONFIRMATION_TOKEN_SERVICE, useValue: mockConfirmationTokenService },
        { provide: MODERATION_CLIENT, useValue: null },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
      ],
    }).compile();

    controller = module.get(AppSpacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a comment memory and publish to spaces', async () => {
      mockMemoryService.create.mockResolvedValue({
        memory_id: 'mem-1',
        created_at: '2026-03-06T00:00:00Z',
      });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-1' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'the_void:test-user-123:mem-1' });

      const result = await controller.createComment(userId, {
        content: 'Great post!',
        parent_id: 'parent-1',
        spaces: ['the_void'],
        tags: ['feedback'],
      });

      expect(result).toEqual({
        memory_id: 'mem-1',
        created_at: '2026-03-06T00:00:00Z',
        composite_id: 'the_void:test-user-123:mem-1',
        published_to: ['the_void'],
      });
      expect(mockMemoryService.create).toHaveBeenCalledWith({
        content: 'Great post!',
        type: 'comment',
        parent_id: 'parent-1',
        thread_root_id: 'parent-1',
        tags: ['feedback'],
      });
      expect(mockSpaceService.publish).toHaveBeenCalledWith({
        memory_id: 'mem-1',
        spaces: ['the_void'],
        groups: undefined,
      });
      expect(mockSpaceService.confirm).toHaveBeenCalledWith({ token: 'tok-1' });
    });

    it('should use thread_root_id when provided', async () => {
      mockMemoryService.create.mockResolvedValue({
        memory_id: 'mem-2',
        created_at: '2026-03-06T00:00:00Z',
      });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-2' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'c-2' });

      await controller.createComment(userId, {
        content: 'Reply to reply',
        parent_id: 'parent-2',
        thread_root_id: 'root-1',
        spaces: ['the_void'],
      });

      expect(mockMemoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_id: 'parent-2',
          thread_root_id: 'root-1',
        }),
      );
    });

    it('should create comment in personal collection when parent is unpublished', async () => {
      mockSpaceService.getPublishedLocations.mockResolvedValue({
        space_ids: [],
        group_ids: [],
      });
      mockMemoryService.create.mockResolvedValue({
        memory_id: 'mem-personal',
        created_at: '2026-03-06T00:00:00Z',
      });

      const result = await controller.createComment(userId, {
        content: 'Self-annotation on personal memory',
        parent_id: 'parent-3',
      });

      expect(result).toEqual({
        memory_id: 'mem-personal',
        created_at: '2026-03-06T00:00:00Z',
        composite_id: undefined,
        published_to: [],
      });
      expect(mockSpaceService.getPublishedLocations).toHaveBeenCalledWith('parent-3');
      expect(mockMemoryService.create).toHaveBeenCalled();
      expect(mockSpaceService.publish).not.toHaveBeenCalled();
      expect(mockSpaceService.confirm).not.toHaveBeenCalled();
    });

    it('should infer publish destination from parent when no spaces/groups provided', async () => {
      mockSpaceService.getPublishedLocations.mockResolvedValue({
        space_ids: ['the_void'],
        group_ids: [],
      });
      mockMemoryService.create.mockResolvedValue({
        memory_id: 'mem-inferred',
        created_at: '2026-03-06T00:00:00Z',
      });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-inferred' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'the_void:test-user-123:mem-inferred' });

      const result = await controller.createComment(userId, {
        content: 'Comment with inferred destination',
        parent_id: 'parent-3',
      });

      expect(result).toEqual({
        memory_id: 'mem-inferred',
        created_at: '2026-03-06T00:00:00Z',
        composite_id: 'the_void:test-user-123:mem-inferred',
        published_to: ['the_void'],
      });
      expect(mockSpaceService.getPublishedLocations).toHaveBeenCalledWith('parent-3');
      expect(mockSpaceService.publish).toHaveBeenCalledWith({
        memory_id: 'mem-inferred',
        spaces: ['the_void'],
        groups: [],
      });
    });

    it('should support groups', async () => {
      mockMemoryService.create.mockResolvedValue({
        memory_id: 'mem-3',
        created_at: '2026-03-06T00:00:00Z',
      });
      mockSpaceService.publish.mockResolvedValue({ token: 'tok-3' });
      mockSpaceService.confirm.mockResolvedValue({ composite_id: 'c-3' });

      const result = await controller.createComment(userId, {
        content: 'Group comment',
        parent_id: 'parent-4',
        groups: ['group-1'],
      });

      expect(result.published_to).toEqual(['group-1']);
      expect(mockSpaceService.publish).toHaveBeenCalledWith({
        memory_id: 'mem-3',
        spaces: undefined,
        groups: ['group-1'],
      });
    });

    it('should propagate errors from memoryService', async () => {
      mockMemoryService.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        controller.createComment(userId, {
          content: 'Will fail',
          parent_id: 'parent-5',
          spaces: ['the_void'],
        }),
      ).rejects.toThrow('Create failed');
    });
  });
});
