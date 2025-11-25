import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmpleadoRepository } from '../../ports/empleado.repository.interface';
import { Empleado, DocumentoEmpleado } from '../../../domain/entities/empleado.entity';
import { AgregarDocumentoDto } from '../../dtos/empleado/agregar-documento.dto';

@Injectable()
export class AgregarDocumentoUseCase {
  constructor(
    @Inject('IEmpleadoRepository')
    private readonly empleadoRepository: IEmpleadoRepository,
  ) {}

  async execute(id: string, dto: AgregarDocumentoDto): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findById(id);
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    const documento: DocumentoEmpleado = {
      tipo: dto.tipo,
      nombre: dto.nombre,
      url: dto.url,
      fechaSubida: new Date(dto.fechaSubida),
    };

    empleado.agregarDocumento(documento);
    return await this.empleadoRepository.save(empleado);
  }
}


