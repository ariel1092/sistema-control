import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { Proveedor } from '../../../domain/entities/proveedor.entity';

@Injectable()
export class GetProveedoresUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async execute(activo?: boolean): Promise<Proveedor[]> {
    return this.proveedorRepository.findAll(activo);
  }
}


