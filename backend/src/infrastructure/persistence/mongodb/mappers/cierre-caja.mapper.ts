import { CierreCaja } from '../../../../domain/entities/cierre-caja.entity';
import { CierreCajaMongo } from '../schemas/cierre-caja.schema';
import { Types } from 'mongoose';

export class CierreCajaMapper {
  static toDomain(cierreCajaDoc: any): CierreCaja {
    if (!cierreCajaDoc) return null;

    return new CierreCaja(
      cierreCajaDoc._id.toString(),
      cierreCajaDoc.fecha,
      cierreCajaDoc.usuarioId.toString(),
      cierreCajaDoc.totalEfectivo,
      cierreCajaDoc.totalTarjeta,
      cierreCajaDoc.totalTransferencia,
      cierreCajaDoc.totalGeneral,
      cierreCajaDoc.cantidadVentas,
      cierreCajaDoc.estado as 'ABIERTO' | 'CERRADO',
      cierreCajaDoc.observaciones,
      cierreCajaDoc.createdAt,
      cierreCajaDoc.updatedAt,
    );
  }

  static toPersistence(cierreCaja: CierreCaja): any {
    // Validar que usuarioId sea un ObjectId válido
    let usuarioId: Types.ObjectId;
    try {
      usuarioId = Types.ObjectId.isValid(cierreCaja.usuarioId)
        ? new Types.ObjectId(cierreCaja.usuarioId)
        : new Types.ObjectId(); // Generar uno nuevo si no es válido
    } catch (error) {
      // Si falla la conversión, generar un nuevo ObjectId
      usuarioId = new Types.ObjectId();
    }

    const doc: any = {
      fecha: cierreCaja.fecha,
      usuarioId: usuarioId,
      totalEfectivo: cierreCaja.totalEfectivo,
      totalTarjeta: cierreCaja.totalTarjeta,
      totalTransferencia: cierreCaja.totalTransferencia,
      totalGeneral: cierreCaja.totalGeneral,
      cantidadVentas: cierreCaja.cantidadVentas,
      estado: cierreCaja.estado,
      observaciones: cierreCaja.observaciones,
    };

    if (cierreCaja.id) {
      (doc as any)._id = new Types.ObjectId(cierreCaja.id);
    }

    return doc;
  }
}

