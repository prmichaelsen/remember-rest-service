import { ConfigService } from './config.service.js';

const REQUIRED_ENV = {
  PLATFORM_SERVICE_TOKEN: 'test-secret-token-32-chars-long!!',
  WEAVIATE_REST_URL: 'http://localhost:8080',
  WEAVIATE_GRPC_URL: 'http://localhost:50051',
  WEAVIATE_API_KEY: 'test-weaviate-key',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY: '{"type":"service_account"}',
  EMBEDDINGS_PROVIDER: 'openai',
  EMBEDDINGS_MODEL: 'text-embedding-3-small',
};

describe('ConfigService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load config with all required values present', () => {
    const service = new ConfigService();
    const config = service.getConfig();

    expect(config.auth.serviceToken).toBe('test-secret-token-32-chars-long!!');
    expect(config.weaviate.restUrl).toBe('http://localhost:8080');
    expect(config.firebase.projectId).toBe('test-project');
    expect(config.embeddings.provider).toBe('openai');
  });

  it('should use default values for optional config', () => {
    delete process.env.NODE_ENV;
    const service = new ConfigService();
    const config = service.getConfig();

    expect(config.server.port).toBe(8080);
    expect(config.server.nodeEnv).toBe('development');
    expect(config.server.logLevel).toBe('info');
    expect(config.auth.issuer).toBe('agentbase.me');
    expect(config.auth.audience).toBe('svc');
    expect(config.cors.origin).toBe('https://agentbase.me');
    expect(config.rateLimit.max).toBe(100);
    expect(config.rateLimit.windowMs).toBe(3600000);
  });

  it('should override defaults with env values', () => {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://custom.example.com';

    const service = new ConfigService();

    expect(service.serverConfig.port).toBe(3000);
    expect(service.serverConfig.nodeEnv).toBe('production');
    expect(service.corsConfig.origin).toBe('https://custom.example.com');
  });

  it('should throw on missing required PLATFORM_SERVICE_TOKEN', () => {
    delete process.env.PLATFORM_SERVICE_TOKEN;
    expect(() => new ConfigService()).toThrow('Missing required environment variable: PLATFORM_SERVICE_TOKEN');
  });

  it('should throw on missing required WEAVIATE_REST_URL', () => {
    delete process.env.WEAVIATE_REST_URL;
    expect(() => new ConfigService()).toThrow('Missing required environment variable: WEAVIATE_REST_URL');
  });

  it('should throw on missing required FIREBASE_PROJECT_ID', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    expect(() => new ConfigService()).toThrow('Missing required environment variable: FIREBASE_PROJECT_ID');
  });

  it('should throw on missing required EMBEDDINGS_PROVIDER', () => {
    delete process.env.EMBEDDINGS_PROVIDER;
    expect(() => new ConfigService()).toThrow('Missing required environment variable: EMBEDDINGS_PROVIDER');
  });

  it('should throw on invalid integer for PORT', () => {
    process.env.PORT = 'not-a-number';
    expect(() => new ConfigService()).toThrow('Environment variable PORT must be a number');
  });

  it('should expose typed accessor properties', () => {
    const service = new ConfigService();

    expect(service.serverConfig).toBeDefined();
    expect(service.authConfig).toBeDefined();
    expect(service.corsConfig).toBeDefined();
    expect(service.rateLimitConfig).toBeDefined();
    expect(service.weaviateConfig).toBeDefined();
    expect(service.firebaseConfig).toBeDefined();
    expect(service.embeddingsConfig).toBeDefined();
    expect(service.awsConfig).toBeDefined();
  });
});
