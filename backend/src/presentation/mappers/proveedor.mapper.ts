import { Proveedor } from '../../domain/entities/proveedor.entity';
import { ProveedorResponseDto } from '../../application/dtos/proveedor/proveedor-response.dto';

export class ProveedorMapper {
  static toResponseDto(proveedor: Proveedor): ProveedorResponseDto {
    if (!proveedor) return null;
    return {
      id: proveedor.id!,
      nombre: proveedor.nombre,
      razonSocial: proveedor.razonSocial,
      cuit: proveedor.cuit,
      domicilio: proveedor.domicilio,
      telefono: proveedor.telefono,
      email: proveedor.email,
      categoria: proveedor.categoria,
      productosProvee: proveedor.productosProvee,
      condicionesCompra: proveedor.condicionesCompra,
      formaPagoHabitual: proveedor.formaPagoHabitual,
      vendedorAsignado: proveedor.vendedorAsignado,
      activo: proveedor.activo,
      observaciones: proveedor.observaciones,
      createdAt: proveedor.createdAt,
      updatedAt: proveedor.updatedAt,
    };
  }
}


