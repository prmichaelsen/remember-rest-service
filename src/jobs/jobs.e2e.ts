import { Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConfigService } from '../config/config.service.js';
import { JobsController } from './jobs.controller.js';
import { JOB_SERVICE, LOGGER } from '../core/core.providers.js';

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

const mockJobService = {
  getStatus: jest.fn(),
  cancel: jest.fn(),
  cleanupExpired: jest.fn(),
};

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('Jobs E2E', () => {
  let app: INestApplication;
  const token = makeToken('test-user');

  beforeAll(async () => {
    const savedEnv = { ...process.env };
    Object.assign(process.env, REQUIRED_ENV);

    const module = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        ConfigService,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: JOB_SERVICE, useValue: mockJobService },
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    process.env = savedEnv;
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/svc/v1/jobs/:id', () => {
    it('should return job status (200)', async () => {
      const job = {
        id: 'job-1',
        type: 'import',
        status: 'completed',
        progress: 100,
        steps: [],
        result: { total: 5 },
        error: null,
      };
      mockJobService.getStatus.mockResolvedValue(job);

      const res = await request(app.getHttpServer())
        .get('/api/svc/v1/jobs/job-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual(job);
    });

    it('should return 404 for non-existent job', async () => {
      mockJobService.getStatus.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/svc/v1/jobs/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/api/svc/v1/jobs/job-1')
        .expect(401);
    });
  });

  describe('POST /api/svc/v1/jobs/:id/cancel', () => {
    it('should cancel a job and return message', async () => {
      mockJobService.getStatus.mockResolvedValue({ id: 'job-1', status: 'running' });
      mockJobService.cancel.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/svc/v1/jobs/job-1/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toEqual({ message: 'Job cancellation requested', job_id: 'job-1' });
      expect(mockJobService.cancel).toHaveBeenCalledWith('job-1');
    });

    it('should return 404 for non-existent job', async () => {
      mockJobService.getStatus.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/svc/v1/jobs/nonexistent/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/svc/v1/jobs/cleanup', () => {
    it('should return deleted count', async () => {
      mockJobService.cleanupExpired.mockResolvedValue(3);

      const res = await request(app.getHttpServer())
        .post('/api/svc/v1/jobs/cleanup')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toEqual({ deleted: 3 });
    });

    it('should return 0 when nothing to clean', async () => {
      mockJobService.cleanupExpired.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .post('/api/svc/v1/jobs/cleanup')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toEqual({ deleted: 0 });
    });
  });
});
