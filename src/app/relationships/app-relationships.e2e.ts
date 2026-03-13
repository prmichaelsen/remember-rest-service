import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../../auth/auth.guard.js';
import { ConfigService } from '../../config/config.service.js';
import { AppRelationshipsController } from './app-relationships.controller.js';
import { WEAVIATE_CLIENT, LOGGER, MEMORY_INDEX } from '../../core/core.providers.js';

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
  getById: jest.fn(),
};

const mockMemoryService = {
  getById: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  RelationshipService: jest.fn().mockImplementation(() => mockRelationshipService),
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
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

const mockMemoryIndex = {};

describe('App Relationships E2E', () => {
  let app: INestApplication;
  let token: string;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    token = makeToken('test-user');

    const module = await Test.createTestingModule({
      controllers: [AppRelationshipsController],
      providers: [
        ConfigService,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: WEAVIATE_CLIENT, useValue: mockWeaviateClient },
        { provide: LOGGER, useValue: mockLogger },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
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

  describe('GET /api/app/v1/relationships/:id/memories', () => {
    const relationship = {
      id: 'rel-1',
      relationship_type: 'related',
      observation: 'Connected memories',
      related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
      member_order: { 'mem-2': 0, 'mem-1': 1, 'mem-3': 2 },
    };

    it('should return memories sorted by member_order position', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship,
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'Alpha', title: 'Alpha' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Beta', title: 'Beta' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', content: 'Gamma', title: 'Gamma' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-1/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.memories).toHaveLength(3);
      // member_order: mem-2=0, mem-1=1, mem-3=2
      expect(res.body.memories[0].id).toBe('mem-2');
      expect(res.body.memories[1].id).toBe('mem-1');
      expect(res.body.memories[2].id).toBe('mem-3');
    });

    it('should include position field on each memory', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship,
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'Alpha' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Beta' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', content: 'Gamma' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-1/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.memories[0].position).toBe(0);
      expect(res.body.memories[1].position).toBe(1);
      expect(res.body.memories[2].position).toBe(2);
    });

    it('should include member_order in relationship metadata', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship,
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'A' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'B' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', content: 'C' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-1/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.relationship.member_order).toEqual({
        'mem-2': 0,
        'mem-1': 1,
        'mem-3': 2,
      });
    });

    it('should fall back to alphabetical sort when no member_order', async () => {
      const noOrderRelationship = {
        id: 'rel-2',
        relationship_type: 'related',
        observation: 'Unordered',
        related_memory_ids: ['mem-1', 'mem-2'],
      };

      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: noOrderRelationship,
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'Zebra', title: 'Zebra' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Apple', title: 'Apple' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-2/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.memories[0].id).toBe('mem-2'); // Apple
      expect(res.body.memories[1].id).toBe('mem-1'); // Zebra
    });

    it('should return 404 for missing relationship', async () => {
      mockRelationshipService.getById.mockResolvedValue({ found: false });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/nonexistent/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-1/memories');

      expect(res.status).toBe(401);
    });

    it('should filter out deleted memories', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-3',
          relationship_type: 'related',
          observation: 'Has deleted',
          related_memory_ids: ['mem-1', 'mem-2'],
          member_order: { 'mem-1': 0, 'mem-2': 1 },
        },
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'Active' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Gone', deleted_at: '2026-01-01T00:00:00Z' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-3/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.memories).toHaveLength(1);
      expect(res.body.memories[0].id).toBe('mem-1');
      expect(res.body.total).toBe(1);
    });

    it('should paginate with limit and offset query params', async () => {
      mockRelationshipService.getById.mockResolvedValue({
        found: true,
        relationship: {
          id: 'rel-4',
          relationship_type: 'related',
          observation: 'Many memories',
          related_memory_ids: ['mem-1', 'mem-2', 'mem-3'],
          member_order: { 'mem-1': 0, 'mem-2': 1, 'mem-3': 2 },
        },
      });
      mockMemoryService.getById
        .mockResolvedValueOnce({ memory: { id: 'mem-1', content: 'First' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-2', content: 'Second' } })
        .mockResolvedValueOnce({ memory: { id: 'mem-3', content: 'Third' } });

      const res = await (request as any)(app.getHttpServer())
        .get('/api/app/v1/relationships/rel-4/memories?limit=1&offset=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.memories).toHaveLength(1);
      expect(res.body.memories[0].id).toBe('mem-2');
      expect(res.body.total).toBe(3);
      expect(res.body.has_more).toBe(true);
    });
  });
});
