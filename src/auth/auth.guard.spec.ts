import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jsonwebtoken from 'jsonwebtoken';

const jwt = (jsonwebtoken as any).default ?? jsonwebtoken;
import { AuthGuard } from './auth.guard.js';
import { ConfigService } from '../config/config.service.js';

const SECRET = 'test-secret-token-32-chars-long!!';

const REQUIRED_ENV = {
  PLATFORM_SERVICE_TOKEN: SECRET,
  WEAVIATE_REST_URL: 'http://localhost:8080',
  WEAVIATE_GRPC_URL: 'http://localhost:50051',
  WEAVIATE_API_KEY: 'test-weaviate-key',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY: '{"type":"service_account"}',
  EMBEDDINGS_PROVIDER: 'openai',
  EMBEDDINGS_MODEL: 'text-embedding-3-small',
};

function createToken(payload: Record<string, unknown>, secret = SECRET): string {
  return jwt.sign(payload, secret);
}

function createValidToken(): string {
  return createToken({
    sub: 'user-123',
    iss: 'agentbase.me',
    aud: 'svc',
  });
}

function createMockContext(authHeader?: string, isPublic = false) {
  const request = {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
    userId: undefined as string | undefined,
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };

  return { context, request };
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    const configService = new ConfigService();
    reflector = new Reflector();
    guard = new AuthGuard(configService, reflector);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should allow requests with valid JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createValidToken();
    const { context, request } = createMockContext(`Bearer ${token}`);

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(request.userId).toBe('user-123');
  });

  it('should skip auth for @Public() endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext();

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
  });

  it('should extract userId on @Public() endpoints when valid auth header is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const token = createValidToken();
    const { context, request } = createMockContext(`Bearer ${token}`);

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(request.userId).toBe('user-123');
  });

  it('should not throw on @Public() endpoints with invalid auth header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context, request } = createMockContext('Bearer invalid-token');

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(request.userId).toBeUndefined();
  });

  it('should reject missing Authorization header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext();

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject non-Bearer scheme', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext('Basic abc123');

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject invalid JWT signature', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createToken(
      { sub: 'user-123', iss: 'agentbase.me', aud: 'svc' },
      'wrong-secret-that-is-long-enough!!',
    );
    const { context } = createMockContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject expired JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createToken({
      sub: 'user-123',
      iss: 'agentbase.me',
      aud: 'svc',
      exp: Math.floor(Date.now() / 1000) - 3600,
    });
    const { context } = createMockContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject wrong issuer', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createToken({
      sub: 'user-123',
      iss: 'wrong-issuer',
      aud: 'svc',
    });
    const { context } = createMockContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject wrong audience', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createToken({
      sub: 'user-123',
      iss: 'agentbase.me',
      aud: 'wrong-audience',
    });
    const { context } = createMockContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });

  it('should reject token without sub claim', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = createToken({
      iss: 'agentbase.me',
      aud: 'svc',
    });
    const { context } = createMockContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context as any)).toThrow(UnauthorizedException);
  });
});
