import { Test } from '@nestjs/testing';
import { Controller, Get, Post, Body, type INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as request from 'supertest';
import { LoggingInterceptor, redactPii } from './logging.interceptor.js';
import { LOGGER } from '../core/core.providers.js';

@Controller('test')
class TestController {
  @Get()
  get() {
    return { ok: true };
  }

  @Post()
  post(@Body() body: any) {
    return { received: true };
  }

  @Get('error')
  error() {
    throw new Error('Test error');
  }
}

describe('redactPii', () => {
  it('should redact sensitive string fields', () => {
    const input = { content: 'my secret diary', name: 'safe' };
    const result = redactPii(input) as any;
    expect(result.content).toBe('[REDACTED]');
    expect(result.name).toBe('safe');
  });

  it('should redact nested sensitive fields', () => {
    const input = {
      user: { email: 'test@example.com', id: '123' },
      data: { observation: 'private note', type: 'note' },
    };
    const result = redactPii(input) as any;
    expect(result.user.email).toBe('[REDACTED]');
    expect(result.user.id).toBe('123');
    expect(result.data.observation).toBe('[REDACTED]');
    expect(result.data.type).toBe('note');
  });

  it('should redact fields in arrays', () => {
    const input = [
      { content: 'secret1', id: '1' },
      { content: 'secret2', id: '2' },
    ];
    const result = redactPii(input) as any[];
    expect(result[0].content).toBe('[REDACTED]');
    expect(result[0].id).toBe('1');
    expect(result[1].content).toBe('[REDACTED]');
  });

  it('should redact auth-related fields', () => {
    const input = {
      password: 'abc',
      secret: 'xyz',
      token: 'tok-123',
      serviceAccountKey: '{"key":"val"}',
      api_key: 'sk-123',
      authorization: 'Bearer xyz',
    };
    const result = redactPii(input) as any;
    expect(result.password).toBe('[REDACTED]');
    expect(result.secret).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
    expect(result.serviceAccountKey).toBe('[REDACTED]');
    expect(result.api_key).toBe('[REDACTED]');
    expect(result.authorization).toBe('[REDACTED]');
  });

  it('should handle null and undefined', () => {
    expect(redactPii(null)).toBeNull();
    expect(redactPii(undefined)).toBeUndefined();
  });

  it('should handle primitives', () => {
    expect(redactPii('hello')).toBe('hello');
    expect(redactPii(42)).toBe(42);
    expect(redactPii(true)).toBe(true);
  });
});

describe('LoggingInterceptor', () => {
  let app: INestApplication;
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        { provide: LOGGER, useValue: mockLogger },
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log incoming request and completed response', async () => {
    await (request as any)(app.getHttpServer()).get('/test');

    expect(mockLogger.info).toHaveBeenCalledTimes(2);

    const incomingCall = mockLogger.info.mock.calls[0];
    expect(incomingCall[0]).toBe('Incoming request');
    expect(incomingCall[1]).toMatchObject({
      method: 'GET',
      path: '/test',
    });
    expect(incomingCall[1].correlationId).toBeDefined();

    const completedCall = mockLogger.info.mock.calls[1];
    expect(completedCall[0]).toBe('Request completed');
    expect(completedCall[1]).toMatchObject({
      method: 'GET',
      path: '/test',
      statusCode: 200,
    });
    expect(typeof completedCall[1].duration).toBe('number');
  });

  it('should use provided x-correlation-id header', async () => {
    await (request as any)(app.getHttpServer())
      .get('/test')
      .set('x-correlation-id', 'custom-id-123');

    const incomingCall = mockLogger.info.mock.calls[0];
    expect(incomingCall[1].correlationId).toBe('custom-id-123');
  });

  it('should redact sensitive fields in request body', async () => {
    await (request as any)(app.getHttpServer())
      .post('/test')
      .send({ content: 'secret data', type: 'note' });

    const incomingCall = mockLogger.info.mock.calls[0];
    expect(incomingCall[1].body.content).toBe('[REDACTED]');
    expect(incomingCall[1].body.type).toBe('note');
  });

  it('should log errors on failed requests', async () => {
    await (request as any)(app.getHttpServer()).get('/test/error');

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    const errorCall = mockLogger.error.mock.calls[0];
    expect(errorCall[0]).toBe('Request failed');
    expect(errorCall[1]).toMatchObject({
      method: 'GET',
      path: '/test/error',
    });
    expect(typeof errorCall[1].duration).toBe('number');
  });

  it('should capture request duration', async () => {
    await (request as any)(app.getHttpServer()).get('/test');

    const completedCall = mockLogger.info.mock.calls[1];
    expect(completedCall[1].duration).toBeGreaterThanOrEqual(0);
  });
});
