import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';

@Injectable()
export class DeleteProveedorUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.proveedorRepository.delete(id);
  }
}


