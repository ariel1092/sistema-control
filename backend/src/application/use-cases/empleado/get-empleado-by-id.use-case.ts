import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado } from '../../../domain/entities/empleado.entity';

@Injectable()
export class GetEmpleadoByIdUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
    return empleado;
  }
}


