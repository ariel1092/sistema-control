import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationException } from '../../application/exceptions/application.exception';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code: string | undefined;

    // Manejar excepciones de dominio
    if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      code = exception.code;
    }
    // Manejar excepciones de aplicación
    else if (exception instanceof ApplicationException) {
      status = exception.statusCode || HttpStatus.BAD_REQUEST;
      message = exception.message;
      code = exception.code;
    }
    // Manejar excepciones HTTP de NestJS
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      code = (exceptionResponse as any).code;
    }
    // Manejar errores de validación
    else if ((exception as any).response) {
      status = (exception as any).status || HttpStatus.BAD_REQUEST;
      message = (exception as any).response.message || message;
    }
    // Otros errores
    else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(code && { code }),
    };

    // Log del error (en producción usar un logger)
    console.error('Error:', {
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }
}





