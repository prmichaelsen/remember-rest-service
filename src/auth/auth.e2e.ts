import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from './auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { MemoriesController } from '../memories/memories.controller.js';
import { HealthController } from '../health/health.controller.js';
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

function makeToken(payload: Record<string, unknown>, options?: jsonwebtoken.SignOptions) {
  return jwt.sign(payload, SECRET, {
    issuer: 'agentbase.me',
    audience: 'svc',
    expiresIn: '1h',
    ...options,
  });
}

const mockMemoryService = {
  create: jest.fn().mockResolvedValue({ memory_id: 'mem-1', created_at: '2026-01-01T00:00:00Z' }),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
}));

const mockWeaviateClient = {
  collections: { get: jest.fn().mockReturnValue({ data: {} }) },
};

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('Auth E2E', () => {
  let app: INestApplication;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };

    const module = await Test.createTestingModule({
      controllers: [MemoriesController, HealthController],
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

  it('should allow access with valid JWT', async () => {
    const token = makeToken({ sub: 'user-1' });
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'test' });

    expect(res.status).toBe(201);
  });

  it('should reject request with no Authorization header', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories')
      .send({ content: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Missing Authorization');
  });

  it('should reject request with invalid token', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories')
      .set('Authorization', 'Bearer invalid-token')
      .send({ content: 'test' });

    expect(res.status).toBe(401);
  });

  it('should reject request with expired token', async () => {
    const token = makeToken({ sub: 'user-1' }, { expiresIn: '-1s' });
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('expired');
  });

  it('should reject request with wrong audience', async () => {
    const token = jwt.sign({ sub: 'user-1' }, SECRET, {
      issuer: 'agentbase.me',
      audience: 'wrong',
      expiresIn: '1h',
    });
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'test' });

    expect(res.status).toBe(401);
  });

  it('should allow access to @Public() health endpoint without auth', async () => {
    const res = await (request as any)(app.getHttpServer())
      .get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
