import { ConfigService } from '../config/config.service.js';

const mockInitWeaviateClient = jest.fn().mockResolvedValue({ isReady: () => true });
const mockInitFirestore = jest.fn();
const mockCreateLogger = jest.fn().mockReturnValue({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  initWeaviateClient: mockInitWeaviateClient,
}));

jest.mock('@prmichaelsen/remember-core/database/firestore', () => ({
  initFirestore: mockInitFirestore,
}));

jest.mock('@prmichaelsen/remember-core/utils', () => ({
  createLogger: mockCreateLogger,
}));

const MockConfirmationTokenService = jest.fn().mockImplementation(() => ({}));

jest.mock('@prmichaelsen/remember-core/services', () => ({
  ConfirmationTokenService: MockConfirmationTokenService,
}));

import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
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
});
