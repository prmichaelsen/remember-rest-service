import { Test } from '@nestjs/testing';
import { TrustController } from './trust.controller.js';
import { WEAVIATE_CLIENT, LOGGER } from '../core/core.providers.js';

const mockHandleGetConfig = jest.fn();
const mockHandleUpdateConfig = jest.fn();
const mockHandleSetTrust = jest.fn();
const mockHandleRemoveTrust = jest.fn();
const mockHandleBlockUser = jest.fn();
const mockHandleUnblockUser = jest.fn();
const mockCheckMemoryAccess = jest.fn();

jest.mock('@prmichaelsen/remember-core/services', () => ({
  handleGetConfig: (...args: any[]) => mockHandleGetConfig(...args),
  handleUpdateConfig: (...args: any[]) => mockHandleUpdateConfig(...args),
  handleSetTrust: (...args: any[]) => mockHandleSetTrust(...args),
  handleRemoveTrust: (...args: any[]) => mockHandleRemoveTrust(...args),
  handleBlockUser: (...args: any[]) => mockHandleBlockUser(...args),
  handleUnblockUser: (...args: any[]) => mockHandleUnblockUser(...args),
  checkMemoryAccess: (...args: any[]) => mockCheckMemoryAccess(...args),
  FirestoreGhostConfigProvider: jest.fn().mockImplementation(() => ({})),
  FirestoreEscalationStore: jest.fn().mockImplementation(() => ({})),
}));

const mockFetchObjectById = jest.fn();
const mockCollection = {
  query: { fetchObjectById: mockFetchObjectById },
};
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

describe('TrustController', () => {
  let controller: TrustController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [TrustController],
      providers: [
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(TrustController);
  });

  describe('getGhostConfig', () => {
    it('should return ghost config for user', async () => {
      const expected = { success: true, config: { enabled: false }, message: 'ok' };
      mockHandleGetConfig.mockResolvedValue(expected);

      const result = await controller.getGhostConfig(userId);

      expect(mockHandleGetConfig).toHaveBeenCalledWith(userId, mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('updateGhostConfig', () => {
    it('should update ghost config', async () => {
      const dto = { enabled: true, enforcement_mode: 'hybrid' };
      const expected = { success: true, config: { enabled: true, enforcement_mode: 'hybrid' }, message: 'updated' };
      mockHandleUpdateConfig.mockResolvedValue(expected);

      const result = await controller.updateGhostConfig(userId, dto);

      expect(mockHandleUpdateConfig).toHaveBeenCalledWith(userId, dto, mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('setUserTrust', () => {
    it('should set trust level for a target user', async () => {
      const dto = { target_user_id: 'other-user', trust_level: 0.75 };
      const expected = { success: true, message: 'trust set' };
      mockHandleSetTrust.mockResolvedValue(expected);

      const result = await controller.setUserTrust(userId, dto);

      expect(mockHandleSetTrust).toHaveBeenCalledWith(userId, 'other-user', 0.75, mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('removeUserTrust', () => {
    it('should remove trust override for a target user', async () => {
      const dto = { target_user_id: 'other-user' };
      const expected = { success: true, message: 'trust removed' };
      mockHandleRemoveTrust.mockResolvedValue(expected);

      const result = await controller.removeUserTrust(userId, dto);

      expect(mockHandleRemoveTrust).toHaveBeenCalledWith(userId, 'other-user', mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('blockUser', () => {
    it('should block a target user', async () => {
      const dto = { target_user_id: 'bad-user' };
      const expected = { success: true, message: 'user blocked' };
      mockHandleBlockUser.mockResolvedValue(expected);

      const result = await controller.blockUser(userId, dto);

      expect(mockHandleBlockUser).toHaveBeenCalledWith(userId, 'bad-user', mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a target user', async () => {
      const dto = { target_user_id: 'bad-user' };
      const expected = { success: true, message: 'user unblocked' };
      mockHandleUnblockUser.mockResolvedValue(expected);

      const result = await controller.unblockUser(userId, dto);

      expect(mockHandleUnblockUser).toHaveBeenCalledWith(userId, 'bad-user', mockLogger);
      expect(result).toEqual(expected);
    });
  });

  describe('checkAccess', () => {
    it('should check memory access for an accessor', async () => {
      const dto = { memory_id: 'mem-1', accessor_user_id: 'accessor-user' };
      mockFetchObjectById.mockResolvedValue({
        properties: { content: 'secret', user_id: userId, trust: 0.5 },
      });
      const expected = { status: 'granted', trust_level: 0.75 };
      mockCheckMemoryAccess.mockResolvedValue(expected);

      const result = await controller.checkAccess(userId, dto);

      expect(mockWeaviateClient.collections.get).toHaveBeenCalledWith(`Memory_users_${userId}`);
      expect(mockFetchObjectById).toHaveBeenCalledWith('mem-1', {
        returnProperties: ['content', 'user_id', 'trust', 'weight', 'type', 'deleted_at', 'tags'],
      });
      expect(mockCheckMemoryAccess).toHaveBeenCalledWith(
        'accessor-user',
        { id: 'mem-1', content: 'secret', user_id: userId, trust: 0.5 },
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual(expected);
    });

    it('should return not_found when memory does not exist', async () => {
      const dto = { memory_id: 'nonexistent', accessor_user_id: 'accessor-user' };
      mockFetchObjectById.mockResolvedValue(null);

      const result = await controller.checkAccess(userId, dto);

      expect(result).toEqual({ status: 'not_found', message: 'Memory not found' });
      expect(mockCheckMemoryAccess).not.toHaveBeenCalled();
    });
  });
});
