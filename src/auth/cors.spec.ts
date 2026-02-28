import { Test } from '@nestjs/testing';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import * as request from 'supertest';

@Controller('test')
class TestController {
  @Get()
  test() {
    return { ok: true };
  }
}

describe('CORS', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    app.enableCors({
      origin: 'https://agentbase.me',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow requests from configured origin', async () => {
    const res = await (request as any)(app.getHttpServer())
      .get('/test')
      .set('Origin', 'https://agentbase.me');

    expect(res.headers['access-control-allow-origin']).toBe('https://agentbase.me');
  });

  it('should handle preflight OPTIONS requests', async () => {
    const res = await (request as any)(app.getHttpServer())
      .options('/test')
      .set('Origin', 'https://agentbase.me')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://agentbase.me');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('should set configured origin regardless of request origin', async () => {
    // Express CORS sets the configured origin; browser enforces the policy
    const res = await (request as any)(app.getHttpServer())
      .get('/test')
      .set('Origin', 'https://evil.com');

    expect(res.headers['access-control-allow-origin']).toBe('https://agentbase.me');
  });
});
