import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AppErrorFilter, FallbackErrorFilter } from './app-error.filter.js';

const mockAppErrorClass = (kind: string) => {
  return class extends Error {
    readonly kind = kind;
    readonly context: Record<string, unknown>;

    constructor(message: string, context: Record<string, unknown> = {}) {
      super(message);
      this.name = this.constructor.name;
      this.context = context;
    }

    toJSON() {
      return { kind: this.kind, name: this.name, message: this.message, context: this.context };
    }
  };
};

jest.mock('@prmichaelsen/remember-core/errors', () => {
  class AppError extends Error {
    readonly kind: string;
    readonly context: Record<string, unknown>;
    constructor(message: string, kind: string, context: Record<string, unknown> = {}) {
      super(message);
      this.kind = kind;
      this.context = context;
      this.name = this.constructor.name;
    }
    toJSON() {
      return { kind: this.kind, name: this.name, message: this.message, context: this.context };
    }
  }
  return {
    AppError,
    HTTP_STATUS: {
      validation: 400,
      unauthorized: 401,
      forbidden: 403,
      not_found: 404,
      conflict: 409,
      rate_limit: 429,
      external: 502,
      internal: 500,
    },
  };
});

const { AppError } = jest.requireMock('@prmichaelsen/remember-core/errors') as {
  AppError: new (msg: string, kind: string, ctx?: Record<string, unknown>) => any;
};

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createMockHost(): ArgumentsHost {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => ({}),
      getNext: () => jest.fn(),
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http' as const,
  } as unknown as ArgumentsHost;
}

describe('AppErrorFilter', () => {
  let filter: AppErrorFilter;

  beforeEach(() => {
    filter = new AppErrorFilter(mockLogger as any);
    jest.clearAllMocks();
  });

  const errorKindToStatus: [string, number][] = [
    ['validation', HttpStatus.BAD_REQUEST],
    ['unauthorized', HttpStatus.UNAUTHORIZED],
    ['forbidden', HttpStatus.FORBIDDEN],
    ['not_found', HttpStatus.NOT_FOUND],
    ['conflict', HttpStatus.CONFLICT],
    ['rate_limit', 429],
    ['external', HttpStatus.BAD_GATEWAY],
    ['internal', HttpStatus.INTERNAL_SERVER_ERROR],
  ];

  it.each(errorKindToStatus)(
    'should map %s error to HTTP %d',
    (kind, expectedStatus) => {
      const error = new AppError(`Test ${kind} error`, kind);
      const host = createMockHost();

      filter.catch(error, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(expectedStatus);
      expect(response.json).toHaveBeenCalledWith({
        error: error.toJSON(),
      });
    },
  );

  it('should log the error', () => {
    const error = new AppError('Test error', 'validation');
    const host = createMockHost();

    filter.catch(error, host);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should default to 500 for unknown error kinds', () => {
    const error = new AppError('Unknown kind', 'unknown_kind');
    const host = createMockHost();

    filter.catch(error, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});

describe('FallbackErrorFilter', () => {
  let filter: FallbackErrorFilter;

  beforeEach(() => {
    filter = new FallbackErrorFilter(mockLogger as any);
    jest.clearAllMocks();
  });

  it('should return 500 for unhandled errors', () => {
    const error = new Error('Something broke');
    const host = createMockHost();

    filter.catch(error, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        kind: 'internal',
        name: 'InternalServerError',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('should not expose stack traces in response', () => {
    const error = new Error('Sensitive details');
    const host = createMockHost();

    filter.catch(error, host);

    const response = host.switchToHttp().getResponse();
    const jsonCall = (response.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.message).toBe('An unexpected error occurred');
    expect(jsonCall.error.stack).toBeUndefined();
  });

  it('should handle non-Error thrown values', () => {
    const host = createMockHost();

    filter.catch('string error', host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
