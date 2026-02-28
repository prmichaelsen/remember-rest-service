import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { LOGGER } from '../core/core.providers.js';

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = new Set([
  'content',
  'email',
  'summary',
  'observation',
  'context_summary',
  'password',
  'secret',
  'token',
  'serviceAccountKey',
  'service_account',
  'apiKey',
  'api_key',
  'authorization',
]);

export function redactPii(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactPii);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactPii(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || randomUUID();
    const { method, url, userId } = request;
    const start = Date.now();

    this.logger.info('Incoming request', {
      correlationId,
      method,
      path: url,
      userId: userId || 'anonymous',
      body: request.body ? redactPii(request.body) : undefined,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          const response = context.switchToHttp().getResponse();
          this.logger.info('Request completed', {
            correlationId,
            method,
            path: url,
            statusCode: response.statusCode,
            duration,
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error('Request failed', {
            correlationId,
            method,
            path: url,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }),
    );
  }
}
