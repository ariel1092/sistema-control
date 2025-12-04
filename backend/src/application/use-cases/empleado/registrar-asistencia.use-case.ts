import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado, AsistenciaEmpleado } from '../../../domain/entities/empleado.entity';
import { RegistrarAsistenciaDto } from '../../dtos/empleado/registrar-asistencia.dto';

@Injectable()
export class RegistrarAsistenciaUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string, dto: RegistrarAsistenciaDto): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    const asistencia: AsistenciaEmpleado = {
      fecha: new Date(dto.fecha),
      presente: dto.presente,
      observaciones: dto.observaciones,
    };

    empleado.registrarAsistencia(asistencia);
    return await this.empleadoRepository.save(empleado);
  }
}








