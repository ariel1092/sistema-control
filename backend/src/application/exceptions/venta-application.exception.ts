import { ApplicationException } from './application.exception';

export class VentaApplicationException extends ApplicationException {
  constructor(
    message: string,
    statusCode: number = 400,
    code?: string,
  ) {
    super(message, code || 'VENTA_APPLICATION_ERROR', statusCode);
  }
}

