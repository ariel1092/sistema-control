import { DomainException } from './domain.exception';

export class VentaDomainException extends DomainException {
  constructor(message: string, code?: string) {
    super(message, code || 'VENTA_DOMAIN_ERROR');
  }
}











