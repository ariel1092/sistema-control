import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado } from '../../../domain/entities/empleado.entity';
import { UpdateEmpleadoDto } from '../../dtos/empleado/update-empleado.dto';

@Injectable()
export class UpdateEmpleadoUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string, dto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    empleado.actualizarDatos(dto);
    return await this.empleadoRepository.save(empleado);
  }
}


