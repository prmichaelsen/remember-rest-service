import { Test } from '@nestjs/testing';
import { ConfirmationsController } from './confirmations.controller.js';
import { WEAVIATE_CLIENT, LOGGER, CONFIRMATION_TOKEN_SERVICE } from '../core/core.providers.js';

const mockSpaceService = {
  confirm: jest.fn(),
  deny: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  SpaceService: jest.fn().mockImplementation(() => mockSpaceService),
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

describe('ConfirmationsController', () => {
  let controller: ConfirmationsController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [ConfirmationsController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: CONFIRMATION_TOKEN_SERVICE, useValue: mockConfirmationTokenService },
      ],
    }).compile();

    controller = module.get(ConfirmationsController);
  });

  describe('confirm', () => {
    it('should confirm a pending action by token', async () => {
      const token = 'tok-123';
      const expected = { action: 'publish', success: true, published_to: ['the_void'] };
      mockSpaceService.confirm.mockResolvedValue(expected);

      const result = await controller.confirm(userId, token);

      expect(mockSpaceService.confirm).toHaveBeenCalledWith({ token });
      expect(result).toEqual(expected);
    });
  });

  describe('deny', () => {
    it('should deny a pending action by token', async () => {
      const token = 'tok-456';
      const expected = { success: true };
      mockSpaceService.deny.mockResolvedValue(expected);

      const result = await controller.deny(userId, token);

      expect(mockSpaceService.deny).toHaveBeenCalledWith({ token });
      expect(result).toEqual(expected);
    });
  });

  describe('per-user collection', () => {
    it('should create SpaceService with correct user collection', async () => {
      const { SpaceService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      MockedService.mockClear();
      mockSpaceService.confirm.mockResolvedValue({ success: true });

      await controller.confirm('user-x', 'tok-1');

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith('Memory_users_user-x');
      expect(MockedService).toHaveBeenCalledWith(
        mockWeaviateClient,
        mockCollection,
        'user-x',
        mockConfirmationTokenService,
        mockLogger,
      );
    });
  });
});
