import { ConfigService } from '../config/config.service.js';

const mockInitWeaviateClient = jest.fn().mockResolvedValue({ isReady: () => true });
const mockEnsureUserCollection = jest.fn().mockResolvedValue(false);
const mockInitFirestore = jest.fn();
const mockCreateLogger = jest.fn().mockReturnValue({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  initWeaviateClient: mockInitWeaviateClient,
  ensureUserCollection: mockEnsureUserCollection,
}));

jest.mock('@prmichaelsen/remember-core/database/firestore', () => ({
  initFirestore: mockInitFirestore,
}));

jest.mock('@prmichaelsen/remember-core/utils', () => ({
  createLogger: mockCreateLogger,
}));

const MockConfirmationTokenService = jest.fn().mockImplementation(() => ({}));
const mockCreateHaikuClient = jest.fn().mockReturnValue({
  validateCluster: jest.fn(),
  extractFeatures: jest.fn(),
});
const MockMemoryIndexService = jest.fn().mockImplementation(() => ({
  index: jest.fn(),
  lookup: jest.fn(),
}));

jest.mock('@prmichaelsen/remember-core/services', () => ({
  ConfirmationTokenService: MockConfirmationTokenService,
  createHaikuClient: mockCreateHaikuClient,
  MemoryIndexService: MockMemoryIndexService,
}));

import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
  haikuClientProvider,
  memoryIndexProvider,
  safeEnsureUserCollection,
} from './core.providers.js';

const REQUIRED_ENV = {
  PLATFORM_SERVICE_TOKEN: 'test-secret-token-32-chars-long!!',
  WEAVIATE_REST_URL: 'http://localhost:8080',
  WEAVIATE_GRPC_URL: 'http://localhost:50051',
  WEAVIATE_API_KEY: 'test-weaviate-key',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY: '{"type":"service_account"}',
  EMBEDDINGS_PROVIDER: 'openai',
  EMBEDDINGS_MODEL: 'text-embedding-3-small',
  EMBEDDINGS_API_KEY: 'test-openai-key',
};

describe('Core Providers', () => {
  const originalEnv = process.env;
  let configService: ConfigService;

  beforeEach(() => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    configService = new ConfigService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('weaviateClientProvider', () => {
    it('should initialize Weaviate client with config values', async () => {
      const factory = (weaviateClientProvider as any).useFactory;
      await factory(configService);

      expect(mockInitWeaviateClient).toHaveBeenCalledWith({
        url: 'http://localhost:8080',
        apiKey: 'test-weaviate-key',
        openaiApiKey: 'test-openai-key',
      });
    });

    it('should not pass openaiApiKey when provider is not openai', async () => {
      process.env.EMBEDDINGS_PROVIDER = 'bedrock';
      configService = new ConfigService();

      const factory = (weaviateClientProvider as any).useFactory;
      await factory(configService);

      expect(mockInitWeaviateClient).toHaveBeenCalledWith({
        url: 'http://localhost:8080',
        apiKey: 'test-weaviate-key',
      });
    });
  });

  describe('firestoreProvider', () => {
    it('should initialize Firestore with config values', () => {
      const factory = (firestoreProvider as any).useFactory;
      factory(configService);

      expect(mockInitFirestore).toHaveBeenCalledWith({
        serviceAccount: '{"type":"service_account"}',
        projectId: 'test-project',
      });
    });
  });

  describe('loggerProvider', () => {
    it('should create logger with debug level in development', () => {
      const factory = (loggerProvider as any).useFactory;
      factory(configService);

      expect(mockCreateLogger).toHaveBeenCalledWith('debug');
    });

    it('should create logger with warn level in production', () => {
      process.env.NODE_ENV = 'production';
      configService = new ConfigService();

      const factory = (loggerProvider as any).useFactory;
      factory(configService);

      expect(mockCreateLogger).toHaveBeenCalledWith('warn');
    });
  });

  describe('confirmationTokenServiceProvider', () => {
    it('should create ConfirmationTokenService with logger', () => {
      const mockLogger = { info: jest.fn() };
      const factory = (confirmationTokenServiceProvider as any).useFactory;
      factory(mockLogger);

      expect(MockConfirmationTokenService).toHaveBeenCalledWith(mockLogger);
    });
  });

  describe('haikuClientProvider', () => {
    it('should create HaikuClient with Anthropic API key and model', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      process.env.ANTHROPIC_HAIKU_MODEL = 'claude-haiku-4-5-20251001';
      configService = new ConfigService();

      const factory = (haikuClientProvider as any).useFactory;
      factory(configService);

      expect(mockCreateHaikuClient).toHaveBeenCalledWith({
        apiKey: 'sk-ant-test-key',
        model: 'claude-haiku-4-5-20251001',
      });
    });

    it('should use default model when ANTHROPIC_HAIKU_MODEL is not set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      delete process.env.ANTHROPIC_HAIKU_MODEL;
      configService = new ConfigService();

      const factory = (haikuClientProvider as any).useFactory;
      factory(configService);

      expect(mockCreateHaikuClient).toHaveBeenCalledWith({
        apiKey: 'sk-ant-test-key',
        model: 'claude-sonnet-4-6-20241210',
      });
    });

    it('should return null when ANTHROPIC_API_KEY is not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      configService = new ConfigService();

      const factory = (haikuClientProvider as any).useFactory;
      const result = factory(configService);

      expect(result).toBeNull();
      expect(mockCreateHaikuClient).not.toHaveBeenCalled();
    });
  });

  describe('memoryIndexProvider', () => {
    it('should create MemoryIndexService with logger', () => {
      const mockLogger = { info: jest.fn() };
      const factory = (memoryIndexProvider as any).useFactory;
      factory(mockLogger);

      expect(MockMemoryIndexService).toHaveBeenCalledWith(mockLogger);
    });
  });

  describe('safeEnsureUserCollection', () => {
    it('should call ensureUserCollection', async () => {
      const client = {};
      await safeEnsureUserCollection(client, 'user-1');
      expect(mockEnsureUserCollection).toHaveBeenCalledWith(client, 'user-1');
    });

    it('should swallow "already exists" errors', async () => {
      mockEnsureUserCollection.mockRejectedValueOnce(
        new Error('class name Memory_users_user1 already exists'),
      );
      await expect(safeEnsureUserCollection({}, 'user1')).resolves.toBeUndefined();
    });

    it('should rethrow other errors', async () => {
      mockEnsureUserCollection.mockRejectedValueOnce(new Error('connection refused'));
      await expect(safeEnsureUserCollection({}, 'user1')).rejects.toThrow('connection refused');
    });
  });
});
