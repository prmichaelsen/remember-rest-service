import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { ConfigService } from '../config/config.service.js';

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

describe('HealthController', () => {
  let controller: HealthController;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [ConfigService],
    }).compile();

    controller = module.get(HealthController);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /health', () => {
    it('should return status ok with timestamp', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('GET /version', () => {
    it('should return version and environment', () => {
      const result = controller.getVersion();

      expect(result.version).toBe('0.1.0');
      expect(result.environment).toBeDefined();
    });
  });
});
