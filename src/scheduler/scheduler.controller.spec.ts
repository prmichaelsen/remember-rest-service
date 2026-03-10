import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller.js';
import { ConfigService } from '../config/config.service.js';
import { WEAVIATE_CLIENT, EVENT_BUS, LOGGER } from '../core/core.providers.js';

// Mock the remember-core services module
const mockScanAndNotify = jest.fn();
jest.mock('@prmichaelsen/remember-core/services', () => ({
  scanAndNotifyFollowUps: (...args: any[]) => mockScanAndNotify(...args),
  getNextMemoryCollection: jest.fn(),
}));

const mockWeaviateClient = { collections: { get: jest.fn() } };
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createMockConfigService(schedulerSecret = '') {
  return {
    schedulerConfig: { secret: schedulerSecret },
  } as unknown as ConfigService;
}

describe('SchedulerController', () => {
  let controller: SchedulerController;

  describe('with EventBus configured (no secret required)', () => {
    const mockEventBus = { emit: jest.fn() };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module = await Test.createTestingModule({
        controllers: [SchedulerController],
        providers: [
          { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
          { provide: EVENT_BUS, useValue: mockEventBus },
          { provide: LOGGER, useValue: mockLogger },
          { provide: ConfigService, useValue: createMockConfigService('') },
        ],
      }).compile();

      controller = module.get(SchedulerController);
    });

    it('calls scanAndNotifyFollowUps with correct deps', async () => {
      mockScanAndNotify.mockResolvedValue({ scanned: 2, notified: 1, failed: 0 });

      await controller.scanFollowUps();

      expect(mockScanAndNotify).toHaveBeenCalledTimes(1);
      const deps = mockScanAndNotify.mock.calls[0][0];
      expect(deps.weaviateClient).toBe(mockWeaviateClient);
      expect(deps.eventBus).toBe(mockEventBus);
      expect(deps.logger).toBe(mockLogger);
      expect(typeof deps.collectionEnumerator).toBe('function');
    });

    it('returns { scanned, notified, failed } from service', async () => {
      const expected = { scanned: 5, notified: 3, failed: 1 };
      mockScanAndNotify.mockResolvedValue(expected);

      const result = await controller.scanFollowUps();

      expect(result).toEqual(expected);
    });
  });

  describe('with scheduler secret configured', () => {
    const mockEventBus = { emit: jest.fn() };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module = await Test.createTestingModule({
        controllers: [SchedulerController],
        providers: [
          { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
          { provide: EVENT_BUS, useValue: mockEventBus },
          { provide: LOGGER, useValue: mockLogger },
          { provide: ConfigService, useValue: createMockConfigService('my-secret-123') },
        ],
      }).compile();

      controller = module.get(SchedulerController);
    });

    it('allows request with correct secret', async () => {
      mockScanAndNotify.mockResolvedValue({ scanned: 1, notified: 1, failed: 0 });

      const result = await controller.scanFollowUps('my-secret-123');

      expect(result).toEqual({ scanned: 1, notified: 1, failed: 0 });
      expect(mockScanAndNotify).toHaveBeenCalledTimes(1);
    });

    it('rejects request with wrong secret', async () => {
      await expect(controller.scanFollowUps('wrong-secret')).rejects.toThrow(UnauthorizedException);
      expect(mockScanAndNotify).not.toHaveBeenCalled();
    });

    it('rejects request with missing secret', async () => {
      await expect(controller.scanFollowUps(undefined)).rejects.toThrow(UnauthorizedException);
      expect(mockScanAndNotify).not.toHaveBeenCalled();
    });
  });

  describe('with null EventBus (webhook not configured)', () => {
    beforeEach(async () => {
      jest.clearAllMocks();

      const module = await Test.createTestingModule({
        controllers: [SchedulerController],
        providers: [
          { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
          { provide: EVENT_BUS, useValue: null },
          { provide: LOGGER, useValue: mockLogger },
          { provide: ConfigService, useValue: createMockConfigService('') },
        ],
      }).compile();

      controller = module.get(SchedulerController);
    });

    it('skips scan and returns zeros when EventBus is null', async () => {
      const result = await controller.scanFollowUps();

      expect(result).toEqual({ scanned: 0, notified: 0, failed: 0, skipped: true });
      expect(mockScanAndNotify).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no EventBus configured'),
      );
    });
  });
});
