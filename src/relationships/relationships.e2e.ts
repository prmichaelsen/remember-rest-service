import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { RelationshipsController } from './relationships.controller.js';
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

const mockRelationshipService = {
  create: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  reorder: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  RelationshipService: jest.fn().mockImplementation(() => mockRelationshipService),
}));

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  ensureUserCollection: jest.fn().mockResolvedValue(false),
}));

jest.mock('@prmichaelsen/remember-core/webhooks', () => ({
  createBatchedWebhookService: jest.fn(),
}));

const mockWeaviateClient = {
  collections: { get: jest.fn().mockReturnValue({ data: {} }) },
};

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('Relationships E2E', () => {
  let app: INestApplication;
  let token: string;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    token = makeToken('test-user');

    const module = await Test.createTestingModule({
      controllers: [RelationshipsController],
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

  // ─── POST /api/svc/v1/relationships ─────────────────────────────────────────

  describe('POST /api/svc/v1/relationships', () => {
    it('should create a relationship', async () => {
      mockRelationshipService.create.mockResolvedValue({
        relationship_id: 'rel-1',
        created_at: '2026-01-01T00:00:00Z',
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memory_ids: ['mem-1', 'mem-2'],
          relationship_type: 'related',
          observation: 'These memories are connected',
        });

      expect(res.status).toBe(201);
      expect(res.body.relationship_id).toBe('rel-1');
      expect(mockRelationshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          memory_ids: ['mem-1', 'mem-2'],
          observation: 'These memories are connected',
        }),
      );
    });

    it('should pass optional fields', async () => {
      mockRelationshipService.create.mockResolvedValue({
        relationship_id: 'rel-2',
        created_at: '2026-01-01T00:00:00Z',
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memory_ids: ['mem-1'],
          relationship_type: 'causal',
          observation: 'Cause and effect',
          strength: 0.8,
          tags: ['important'],
          source: 'user',
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.8,
          tags: ['important'],
          source: 'user',
        }),
      );
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships')
        .send({
          memory_ids: ['mem-1'],
          relationship_type: 'related',
          observation: 'test',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when memory_ids missing', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          relationship_type: 'related',
          observation: 'test',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when observation missing', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memory_ids: ['mem-1'],
          relationship_type: 'related',
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/svc/v1/relationships/search ──────────────────────────────────

  describe('POST /api/svc/v1/relationships/search', () => {
    it('should search relationships', async () => {
      mockRelationshipService.search.mockResolvedValue({
        relationships: [],
        total: 0,
        offset: 0,
        limit: 10,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'find connections' });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(0);
    });

    it('should pass optional filters', async () => {
      mockRelationshipService.search.mockResolvedValue({
        relationships: [],
        total: 0,
        offset: 0,
        limit: 10,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'test',
          relationship_types: ['causal'],
          strength_min: 0.5,
          tags: ['important'],
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          relationship_types: ['causal'],
          strength_min: 0.5,
          tags: ['important'],
        }),
      );
    });

    it('should return 400 when query missing', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/search')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/search')
        .send({ query: 'test' });

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /api/svc/v1/relationships/:id ────────────────────────────────────

  describe('PATCH /api/svc/v1/relationships/:id', () => {
    it('should update a relationship', async () => {
      mockRelationshipService.update.mockResolvedValue({
        relationship_id: 'rel-1',
        updated_at: '2026-01-02T00:00:00Z',
        version: 2,
        updated_fields: ['observation'],
      });

      const res = await (request as any)(app.getHttpServer())
        .patch('/api/svc/v1/relationships/rel-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ observation: 'Updated observation' });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
      expect(mockRelationshipService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          relationship_id: 'rel-1',
          observation: 'Updated observation',
        }),
      );
    });

    it('should update with add_memory_ids', async () => {
      mockRelationshipService.update.mockResolvedValue({
        relationship_id: 'rel-1',
        updated_at: '2026-01-02T00:00:00Z',
        version: 3,
        updated_fields: ['add_memory_ids'],
      });

      const res = await (request as any)(app.getHttpServer())
        .patch('/api/svc/v1/relationships/rel-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ add_memory_ids: ['mem-3', 'mem-4'] });

      expect(res.status).toBe(200);
      expect(mockRelationshipService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          relationship_id: 'rel-1',
          add_memory_ids: ['mem-3', 'mem-4'],
        }),
      );
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .patch('/api/svc/v1/relationships/rel-1')
        .send({ observation: 'test' });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /api/svc/v1/relationships/:id ───────────────────────────────────

  describe('DELETE /api/svc/v1/relationships/:id', () => {
    it('should delete a relationship', async () => {
      mockRelationshipService.delete.mockResolvedValue({
        relationship_id: 'rel-1',
        deleted_at: '2026-01-03T00:00:00Z',
      });

      const res = await (request as any)(app.getHttpServer())
        .delete('/api/svc/v1/relationships/rel-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted_at).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .delete('/api/svc/v1/relationships/rel-1');

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/svc/v1/relationships/:id/reorder ────────────────────────────

  describe('POST /api/svc/v1/relationships/:id/reorder', () => {
    it('should reorder with move_to_index', async () => {
      mockRelationshipService.reorder.mockResolvedValue({
        relationship_id: 'rel-1',
        member_order: { 'mem-1': 0, 'mem-2': 1 },
        version: 2,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operation: { type: 'move_to_index', memory_id: 'mem-1', index: 0 },
          version: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.member_order).toBeDefined();
      expect(mockRelationshipService.reorder).toHaveBeenCalledWith(
        expect.objectContaining({
          relationship_id: 'rel-1',
          operation: { type: 'move_to_index', memory_id: 'mem-1', index: 0 },
          version: 1,
        }),
      );
    });

    it('should reorder with swap', async () => {
      mockRelationshipService.reorder.mockResolvedValue({
        relationship_id: 'rel-1',
        member_order: { 'mem-1': 1, 'mem-2': 0 },
        version: 2,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operation: { type: 'swap', memory_id_a: 'mem-1', memory_id_b: 'mem-2' },
          version: 1,
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.reorder).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: { type: 'swap', memory_id_a: 'mem-1', memory_id_b: 'mem-2' },
        }),
      );
    });

    it('should reorder with set_order', async () => {
      mockRelationshipService.reorder.mockResolvedValue({
        relationship_id: 'rel-1',
        member_order: { 'mem-2': 0, 'mem-1': 1 },
        version: 2,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operation: { type: 'set_order', ordered_memory_ids: ['mem-2', 'mem-1'] },
          version: 1,
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.reorder).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: { type: 'set_order', ordered_memory_ids: ['mem-2', 'mem-1'] },
        }),
      );
    });

    it('should reorder with move_before', async () => {
      mockRelationshipService.reorder.mockResolvedValue({
        relationship_id: 'rel-1',
        member_order: { 'mem-2': 0, 'mem-1': 1 },
        version: 2,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operation: { type: 'move_before', memory_id: 'mem-2', before: 'mem-1' },
          version: 1,
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.reorder).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: { type: 'move_before', memory_id: 'mem-2', before: 'mem-1' },
        }),
      );
    });

    it('should reorder with move_after', async () => {
      mockRelationshipService.reorder.mockResolvedValue({
        relationship_id: 'rel-1',
        member_order: { 'mem-1': 0, 'mem-2': 1 },
        version: 2,
      });

      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operation: { type: 'move_after', memory_id: 'mem-2', after: 'mem-1' },
          version: 1,
        });

      expect(res.status).toBe(201);
      expect(mockRelationshipService.reorder).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: { type: 'move_after', memory_id: 'mem-2', after: 'mem-1' },
        }),
      );
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .post('/api/svc/v1/relationships/rel-1/reorder')
        .send({
          operation: { type: 'move_to_index', memory_id: 'mem-1', index: 0 },
          version: 1,
        });

      expect(res.status).toBe(401);
    });
  });
});
