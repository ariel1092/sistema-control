import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado, PagoEmpleado } from '../../../domain/entities/empleado.entity';
import { RegistrarPagoDto } from '../../dtos/empleado/registrar-pago.dto';

@Injectable()
export class RegistrarPagoUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string, dto: RegistrarPagoDto): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    const pago: PagoEmpleado = {
      mes: dto.mes,
      monto: dto.monto,
      fechaPago: new Date(dto.fechaPago),
      observaciones: dto.observaciones,
    };

    empleado.agregarPago(pago);
    return await this.empleadoRepository.save(empleado);
  }
}


