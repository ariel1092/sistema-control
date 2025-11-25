import { Proveedor } from '../../../../domain/entities/proveedor.entity';
import { ProveedorMongo, ProveedorDocument } from '../schemas/proveedor.schema';
import { Types } from 'mongoose';
import { CategoriaProveedor } from '../../../../domain/enums/categoria-proveedor.enum';
import { FormaPagoProveedor } from '../../../../domain/enums/forma-pago-proveedor.enum';

export class ProveedorMapper {
  static toDomain(proveedorDoc: ProveedorDocument): Proveedor {
    if (!proveedorDoc) return null;

    // createdAt y updatedAt se agregan automáticamente por timestamps: true
    const doc = proveedorDoc as any;

    return new Proveedor(
      proveedorDoc._id.toString(),
      proveedorDoc.nombre,
      proveedorDoc.razonSocial,
      proveedorDoc.cuit,
      proveedorDoc.domicilio,
      proveedorDoc.telefono,
      proveedorDoc.email,
      proveedorDoc.categoria as CategoriaProveedor,
      proveedorDoc.productosProvee || [],
      proveedorDoc.condicionesCompra || '',
      proveedorDoc.formaPagoHabitual as FormaPagoProveedor,
      proveedorDoc.vendedorAsignado,
      proveedorDoc.activo,
      proveedorDoc.observaciones,
      doc.createdAt || new Date(),
      doc.updatedAt || new Date(),
    );
  }

  static toPersistence(proveedor: Proveedor): Partial<ProveedorMongo> {
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
    };

    if (proveedor.id) {
      (doc as any)._id = new Types.ObjectId(proveedor.id);
    }

    return doc;
  }
}

