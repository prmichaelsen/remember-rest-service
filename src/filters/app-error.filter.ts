import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AppError, HTTP_STATUS } from '@prmichaelsen/remember-core/errors';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import type { Response } from 'express';
import { LOGGER } from '../core/core.providers.js';

@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      HTTP_STATUS[exception.kind as keyof typeof HTTP_STATUS] ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`AppError [${exception.kind}]: ${exception.message}`, {
      kind: exception.kind,
      context: (exception as any).context,
    });

    response.status(status).json({ error: exception.toJSON() });
  }
}

@Catch()
export class FallbackErrorFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message =
      exception instanceof Error ? exception.message : 'Unknown error';

    this.logger.error(`Unhandled error: ${message}`, {
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        kind: 'internal',
        name: 'InternalServerError',
        message: 'An unexpected error occurred',
      },
    });
  }
}
