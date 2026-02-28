import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { MemoriesController } from '../memories/memories.controller.js';
import { AppErrorFilter, FallbackErrorFilter } from './app-error.filter.js';
import { WEAVIATE_CLIENT, LOGGER } from '../core/core.providers.js';

const jwt = (jsonwebtoken as any).default ?? jsonwebtoken;

const SECRET = 'test-secret-token-32-chars-long!!';

const REQUIRED_ENV = {
  PLATFORM_SERVICE_TOKEN: SECRET,
  WEAVIATE_REST_URL: 'http://localhost:8080',
  WEAVIATE_GRPC_URL: 'http://localhost:50051',
  WEAVIATE_API_KEY: 'wk',
  FIREBASE_PROJECT_ID: 'fp',
  FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY: '{}',
  EMBEDDINGS_PROVIDER: 'openai',
  EMBEDDINGS_MODEL: 'm',
  EMBEDDINGS_API_KEY: 'ek',
};

function makeToken(sub: string) {
  return jwt.sign({ sub }, SECRET, {
    issuer: 'agentbase.me',
    audience: 'svc',
    expiresIn: '1h',
  });
}

const mockMemoryService = {
  create: jest.fn(),
  search: jest.fn(),
  findSimilar: jest.fn(),
  query: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
}));

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  ensureUserCollection: jest.fn().mockResolvedValue(false),
}));

const mockWeaviateClient = {
  collections: { get: jest.fn().mockReturnValue({ data: {} }) },
};

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('Error Handling E2E', () => {
  let app: INestApplication;
  let token: string;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    token = makeToken('test-user');

    const module = await Test.createTestingModule({
      controllers: [MemoriesController],
      providers: [
        ConfigService,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(
      new FallbackErrorFilter(mockLogger as any),
      new AppErrorFilter(mockLogger as any),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation errors', () => {
    it('should return 400 for missing required content field', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for invalid weight value', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'test', weight: 5 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing required search query', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/search')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should strip unknown fields with whitelist', async () => {
      mockMemoryService.create.mockResolvedValue({ memory_id: 'mem-1', created_at: '' });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'test', unknownField: 'should be rejected' });

      expect(res.status).toBe(400);
    });
  });

  describe('AppError mapping', () => {
    it('should map remember-core errors to HTTP status via AppErrorFilter', async () => {
      const { NotFoundError } = await import('@prmichaelsen/remember-core/errors');

      mockMemoryService.search.mockRejectedValue(
        new NotFoundError('Memory', 'nonexistent'),
      );

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'test' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.kind).toBe('not_found');
    });
  });

  describe('Unhandled errors', () => {
    it('should return 500 for unexpected errors via FallbackErrorFilter', async () => {
      mockMemoryService.search.mockRejectedValue(new Error('Unexpected database failure'));

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'test' });

      expect(res.status).toBe(500);
      expect(res.body.error.kind).toBe('internal');
      expect(res.body.error.message).toBe('An unexpected error occurred');
    });
  });
});
