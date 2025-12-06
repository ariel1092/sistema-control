import { Injectable, Inject } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado } from '../../../domain/entities/empleado.entity';

@Injectable()
export class GetAllEmpleadosUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(activos?: boolean): Promise<Empleado[]> {
    return await this.empleadoRepository.findAll(activos);
  }
}









