import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado, PuestoEmpleado } from '../../../domain/entities/empleado.entity';
import { CreateEmpleadoDto } from '../../dtos/empleado/create-empleado.dto';

@Injectable()
export class CreateEmpleadoUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(dto: CreateEmpleadoDto): Promise<Empleado> {
    // Verificar si ya existe un empleado con el mismo DNI
    const empleadoExistente = await this.empleadoRepository.findByDni(dto.dni);
    if (empleadoExistente) {
      throw new ConflictException(`Ya existe un empleado con el DNI ${dto.dni}`);
    }

    const empleado = Empleado.crear({
      nombre: dto.nombre,
      dni: dto.dni,
      telefono: dto.telefono,
      direccion: dto.direccion,
      puesto: dto.puesto as PuestoEmpleado,
      fechaIngreso: new Date(dto.fechaIngreso),
      sueldoMensual: dto.sueldoMensual,
    });

    return await this.empleadoRepository.save(empleado);
  }
}


