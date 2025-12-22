import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { CreateProveedorDto } from '../../dtos/proveedor/create-proveedor.dto';
import { Proveedor } from '../../../domain/entities/proveedor.entity';

@Injectable()
export class CreateProveedorUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async execute(dto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = Proveedor.crear({
      nombre: dto.nombre,
      razonSocial: dto.razonSocial,
      cuit: dto.cuit,
      domicilio: dto.domicilio,
      telefono: dto.telefono,
      email: dto.email,
      categoria: dto.categoria,
      productosProvee: dto.productosProvee || [],
      condicionesCompra: dto.condicionesCompra || '',
      formaPagoHabitual: dto.formaPagoHabitual,
      vendedorAsignado: dto.vendedorAsignado,
      activo: dto.activo !== undefined ? dto.activo : true,
      observaciones: dto.observaciones,
      plazoCuentaCorriente: dto.plazoCuentaCorriente,
      descuento: dto.descuento,
      margenGanancia: dto.margenGanancia,
    });

    return await this.proveedorRepository.save(proveedor);
  }
}





