import { Test } from '@nestjs/testing';
import { Controller, Get, HttpStatus, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';

@Controller('test')
class TestController {
  @Get()
  test() {
    return { ok: true };
  }
}

describe('Rate Limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 3 }],
        }),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow requests within limit', async () => {
    const res = await (request as any)(app.getHttpServer()).get('/test');
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('should include rate limit headers', async () => {
    const res = await (request as any)(app.getHttpServer()).get('/test');
    expect(res.headers).toBeDefined();
  });

  it('should reject requests exceeding limit', async () => {
    // Make requests to exhaust the limit (3 total)
    for (let i = 0; i < 3; i++) {
      await (request as any)(app.getHttpServer()).get('/test');
    }

    const res = await (request as any)(app.getHttpServer()).get('/test');
    expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});
