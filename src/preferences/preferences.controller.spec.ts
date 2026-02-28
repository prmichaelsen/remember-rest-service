import { Test } from '@nestjs/testing';
import { PreferencesController } from './preferences.controller.js';
import { LOGGER } from '../core/core.providers.js';

const mockPreferencesService = {
  getPreferences: jest.fn(),
  updatePreferences: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  PreferencesDatabaseService: jest.fn().mockImplementation(() => mockPreferencesService),
}));

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('PreferencesController', () => {
  let controller: PreferencesController;
  const userId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [PreferencesController],
      providers: [
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(PreferencesController);
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const expected = {
        user_id: userId,
        search: { default_limit: 10, default_alpha: 0.7 },
        privacy: { default_trust_level: 0.25 },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      mockPreferencesService.getPreferences.mockResolvedValue(expected);

      const result = await controller.getPreferences(userId);

      expect(mockPreferencesService.getPreferences).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences and return updated result', async () => {
      const dto = {
        search: { default_limit: 20 },
        privacy: { audit_logging: true },
      };
      const expected = {
        user_id: userId,
        search: { default_limit: 20, default_alpha: 0.7 },
        privacy: { default_trust_level: 0.25, audit_logging: true },
        updated_at: '2026-01-02T00:00:00Z',
      };
      mockPreferencesService.updatePreferences.mockResolvedValue(expected);

      const result = await controller.updatePreferences(userId, dto);

      expect(mockPreferencesService.updatePreferences).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });

    it('should update a single preference section', async () => {
      const dto = { display: { timezone: 'America/Chicago' } };
      mockPreferencesService.updatePreferences.mockResolvedValue({ display: { timezone: 'America/Chicago' } });

      await controller.updatePreferences(userId, dto);

      expect(mockPreferencesService.updatePreferences).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('service instantiation', () => {
    it('should create PreferencesDatabaseService with logger', () => {
      const { PreferencesDatabaseService: MockedService } = jest.requireMock('@prmichaelsen/remember-core/services') as any;
      expect(MockedService).toHaveBeenCalledWith(mockLogger);
    });
  });
});
