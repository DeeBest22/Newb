import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

const sentry_dsn = process.env.SENTRY_URL;

if (sentry_dsn) {
  Sentry.init({
    dsn: sentry_dsn,
  });
}

export class ValidationException extends BadRequestException {
  constructor(public validationErrors: Record<string, unknown>) {
    super('Validation Error');
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse: any = {
      statusCode,
      success: false,
      path: request.url,
      message: exception.message,
      errors:
        exception instanceof ValidationException
          ? exception.validationErrors
          : undefined,
    };

    Logger.error(
      `Request method: ${request.method}, Request URL: ${request.url}`,
      JSON.stringify(errorResponse),
    );

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(exception);
    }

    response
      .status(statusCode)
      .json(
        process.env.NODE_ENV === 'development'
          ? errorResponse
          : { statusCode, success: false, message },
      );
  }
}
