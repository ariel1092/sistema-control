import { DomainException } from './domain.exception';

export class ProductoDomainException extends DomainException {
  constructor(message: string, code?: string) {
    super(message, code || 'PRODUCTO_DOMAIN_ERROR');
  }
}





