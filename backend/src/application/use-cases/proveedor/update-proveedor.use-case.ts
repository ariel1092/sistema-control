import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { UpdateProveedorDto } from '../../dtos/proveedor/update-proveedor.dto';
import { Proveedor } from '../../../domain/entities/proveedor.entity';

@Injectable()
export class UpdateProveedorUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async execute(id: string, dto: UpdateProveedorDto): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findById(id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    proveedor.actualizarDatos({
      nombre: dto.nombre,
      razonSocial: dto.razonSocial,
      cuit: dto.cuit,
      domicilio: dto.domicilio,
      telefono: dto.telefono,
      email: dto.email,
      categoria: dto.categoria,
      productosProvee: dto.productosProvee,
      condicionesCompra: dto.condicionesCompra,
      formaPagoHabitual: dto.formaPagoHabitual,
      vendedorAsignado: dto.vendedorAsignado,
      activo: dto.activo,
      observaciones: dto.observaciones,
      plazoCuentaCorriente: dto.plazoCuentaCorriente,
      descuento: dto.descuento,
      margenGanancia: dto.margenGanancia,
    });

    return await this.proveedorRepository.save(proveedor);
  }
}





