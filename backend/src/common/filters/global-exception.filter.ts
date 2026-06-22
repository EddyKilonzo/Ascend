import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code    = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status  = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;
      message = (body.message as string | string[]) || exception.message;
      code    = (body.error as string) || 'HTTP_ERROR';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, message, code } = this.handlePrismaError(exception));
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    const isProd = process.env.NODE_ENV === 'production';

    response.status(status).json({
      success:   false,
      statusCode: status,
      code,
      message,
      path:      request.url,
      timestamp: new Date().toISOString(),
      ...(isProd ? {} : { stack: exception instanceof Error ? exception.stack : undefined }),
    });
  }

  private handlePrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT,   message: 'Resource already exists', code: 'DUPLICATE_ENTRY' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND,  message: 'Resource not found',      code: 'NOT_FOUND'       };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'Invalid relation',        code: 'INVALID_RELATION' };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error', code: 'DB_ERROR'       };
    }
  }
}
