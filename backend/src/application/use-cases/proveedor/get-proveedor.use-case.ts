import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { Proveedor } from '../../../domain/entities/proveedor.entity';

@Injectable()
export class GetProveedorUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async execute(id: string): Promise<Proveedor | null> {
    return this.proveedorRepository.findById(id);
  }
}





