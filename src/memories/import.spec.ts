import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { MemoriesController } from './memories.controller.js';
import { WEAVIATE_CLIENT, LOGGER, HAIKU_CLIENT, JOB_SERVICE, MEMORY_INDEX, EXTRACTOR_REGISTRY } from '../core/core.providers.js';

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
  byTime: jest.fn(),
  byDensity: jest.fn(),
  byRating: jest.fn(),
};

const mockRelationshipService = {};

const mockWorkerExecute = jest.fn().mockResolvedValue(undefined);
const MockImportJobWorker = jest.fn().mockImplementation(() => ({
  execute: mockWorkerExecute,
}));

const mockValidateImportItems = jest.fn().mockReturnValue([]);

jest.mock('@prmichaelsen/remember-core/services', () => ({
  MemoryService: jest.fn().mockImplementation(() => mockMemoryService),
  RelationshipService: jest.fn().mockImplementation(() => mockRelationshipService),
  RatingService: jest.fn().mockImplementation(() => ({})),
  get ImportJobWorker() { return MockImportJobWorker; },
  DEFAULT_TTL_HOURS: { import: 1, rem_cycle: 24 },
  get validateImportItems() { return mockValidateImportItems; },
}));

jest.mock('@prmichaelsen/remember-core/database/weaviate', () => ({
  ensureUserCollection: jest.fn().mockResolvedValue(false),
}));

jest.mock('@prmichaelsen/remember-core/search', () => ({
  searchByTimeSlice: jest.fn(),
  searchByDensitySlice: jest.fn(),
}));

const mockWeaviateClient = {
  collections: { get: jest.fn().mockReturnValue({ data: {} }) },
};

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockHaikuClient = { validateCluster: jest.fn(), extractFeatures: jest.fn() };

const mockJobService = {
  create: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getStatus: jest.fn(),
  cancel: jest.fn(),
  cleanupExpired: jest.fn(),
};

const mockMemoryIndex = { index: jest.fn(), lookup: jest.fn() };

const mockExtractorRegistry = {
  getExtractor: jest.fn(),
  getSupportedMimeTypes: jest.fn().mockReturnValue([
    'text/plain', 'text/html', 'text/markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
};

describe('Import E2E', () => {
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
        { provide: HAIKU_CLIENT, useValue: mockHaikuClient },
        { provide: JOB_SERVICE, useValue: mockJobService },
        { provide: MEMORY_INDEX, useValue: mockMemoryIndex },
        { provide: EXTRACTOR_REGISTRY, useValue: mockExtractorRegistry },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJobService.create.mockResolvedValue({ id: 'job-123' });
    mockValidateImportItems.mockReturnValue([]);
  });

  it('should accept text-only import and return 202', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ content: 'Hello world' }] });

    expect(res.status).toBe(202);
    expect(res.body.job_id).toBe('job-123');
  });

  it('should accept file_url import and return 202', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ file_url: 'https://storage.example.com/doc.pdf', mime_type: 'application/pdf' }],
      });

    expect(res.status).toBe(202);
    expect(res.body.job_id).toBe('job-123');
  });

  it('should return 400 when validation fails', async () => {
    mockValidateImportItems.mockReturnValueOnce([
      { index: 0, error: 'file_url provided without mime_type' },
    ]);

    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ file_url: 'https://storage.example.com/file.bin' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid import items');
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.supported_types).toContain('text/plain');
    expect(mockJobService.create).not.toHaveBeenCalled();
  });

  it('should return 401 without auth', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories/import')
      .send({ items: [{ content: 'text' }] });

    expect(res.status).toBe(401);
  });

  it('should set Location header on success', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/svc/v1/memories/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ content: 'text' }] });

    expect(res.headers.location).toBe('/api/svc/v1/jobs/job-123');
  });
});
