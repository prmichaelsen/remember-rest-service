import { Test } from '@nestjs/testing';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User, Public } from './decorators.js';

@Controller('test')
class TestController {
  @Public()
  @Get('user')
  getUser(@User() userId: string) {
    return { userId };
  }
}

describe('Decorators', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('@User()', () => {
    it('should extract userId from request', async () => {
      // Simulate middleware setting userId on request
      app.use((req: any, _res: any, next: any) => {
        req.userId = 'test-user-abc';
        next();
      });
      // Re-init to pick up middleware
      await app.close();

      const module = await Test.createTestingModule({
        controllers: [TestController],
      }).compile();

      app = module.createNestApplication();
      app.use((req: any, _res: any, next: any) => {
        req.userId = 'test-user-abc';
        next();
      });
      await app.init();

      const res = await (request as any)(app.getHttpServer()).get('/test/user');
      expect(res.body.userId).toBe('test-user-abc');
    });

    it('should return undefined when userId is not set', async () => {
      const module = await Test.createTestingModule({
        controllers: [TestController],
      }).compile();

      const freshApp = module.createNestApplication();
      await freshApp.init();

      const res = await (request as any)(freshApp.getHttpServer()).get('/test/user');
      expect(res.body.userId).toBeUndefined();

      await freshApp.close();
    });
  });
});
