import { Proveedor } from '../../../../domain/entities/proveedor.entity';
import { ProveedorMongo } from '../schemas/proveedor.schema';

export class ProveedorMapper {
  static toDomain(proveedorDoc: any): Proveedor {
    if (!proveedorDoc) return null;

    return new Proveedor(
      proveedorDoc._id.toString(),
      proveedorDoc.nombre,
      proveedorDoc.razonSocial,
      proveedorDoc.cuit,
      proveedorDoc.domicilio,
      proveedorDoc.telefono,
      proveedorDoc.email,
      proveedorDoc.categoria as any,
      proveedorDoc.productosProvee || [],
      proveedorDoc.condicionesCompra || '',
      proveedorDoc.formaPagoHabitual as any,
      proveedorDoc.vendedorAsignado,
      proveedorDoc.activo !== undefined ? proveedorDoc.activo : true,
      proveedorDoc.observaciones,
      proveedorDoc.plazoCuentaCorriente,
      proveedorDoc.descuento,
      proveedorDoc.createdAt,
      proveedorDoc.updatedAt,
    );
  }

  static toPersistence(proveedor: Proveedor): any {
    const doc: any = {
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
      plazoCuentaCorriente: proveedor.plazoCuentaCorriente,
      descuento: proveedor.descuento,
    };

    if (proveedor.id) {
      (doc as any)._id = proveedor.id;
    }

    return doc;
  }
}
