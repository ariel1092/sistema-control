import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado, AdelantoEmpleado } from '../../../domain/entities/empleado.entity';
import { RegistrarAdelantoDto } from '../../dtos/empleado/registrar-adelanto.dto';

@Injectable()
export class RegistrarAdelantoUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string, dto: RegistrarAdelantoDto): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    const adelanto: AdelantoEmpleado = {
      fecha: new Date(dto.fecha),
      monto: dto.monto,
      mesAplicado: dto.mesAplicado,
      observaciones: dto.observaciones,
    };

    empleado.agregarAdelanto(adelanto);
    return await this.empleadoRepository.save(empleado);
  }
}









