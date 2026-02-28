import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { MemoriesController } from './memories.controller.js';
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

describe('Memories E2E', () => {
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/svc/v1/memories', () => {
    it('should create a memory', async () => {
      mockMemoryService.create.mockResolvedValue({ memory_id: 'mem-1', created_at: '2026-01-01T00:00:00Z' });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'My first memory' });

      expect(res.status).toBe(201);
      expect(res.body.memory_id).toBe('mem-1');
      expect(mockMemoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'My first memory' }),
      );
    });
  });

  describe('POST /api/svc/v1/memories/search', () => {
    it('should search memories', async () => {
      mockMemoryService.search.mockResolvedValue({ memories: [], total: 0, offset: 0, limit: 10 });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'find something' });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(0);
    });
  });

  describe('POST /api/svc/v1/memories/similar', () => {
    it('should find similar memories', async () => {
      mockMemoryService.findSimilar.mockResolvedValue({ similar_memories: [], total: 0 });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/similar')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'similar to this' });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(0);
    });
  });

  describe('POST /api/svc/v1/memories/query', () => {
    it('should query memories semantically', async () => {
      mockMemoryService.query.mockResolvedValue({ memories: [], total: 0 });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/memories/query')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'what do I know about cats' });

      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/svc/v1/memories/:id', () => {
    it('should update a memory', async () => {
      mockMemoryService.update.mockResolvedValue({
        memory_id: 'mem-1',
        updated_at: '2026-01-02T00:00:00Z',
        version: 2,
        updated_fields: ['content'],
      });

      const res = await (request as any)(app.getHttpServer())
        .patch('/api/svc/v1/memories/mem-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
      expect(mockMemoryService.update).toHaveBeenCalledWith(
        expect.objectContaining({ memory_id: 'mem-1', content: 'Updated content' }),
      );
    });
  });

  describe('DELETE /api/svc/v1/memories/:id', () => {
    it('should soft-delete a memory', async () => {
      mockMemoryService.delete.mockResolvedValue({
        memory_id: 'mem-1',
        deleted_at: '2026-01-03T00:00:00Z',
        orphaned_relationship_ids: [],
      });

      const res = await (request as any)(app.getHttpServer())
        .delete('/api/svc/v1/memories/mem-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'cleanup' });

      expect(res.status).toBe(200);
      expect(res.body.deleted_at).toBeDefined();
    });
  });
});
