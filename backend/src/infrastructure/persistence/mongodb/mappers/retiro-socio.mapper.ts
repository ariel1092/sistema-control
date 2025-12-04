import { RetiroSocio } from '../../../../domain/entities/retiro-socio.entity';
import { RetiroSocioMongo, RetiroSocioDocument } from '../schemas/retiro-socio.schema';

export class RetiroSocioMapper {
  static toDomain(retiroDoc: RetiroSocioDocument): RetiroSocio {
    if (!retiroDoc) return null;

    return new RetiroSocio(
      retiroDoc._id.toString(),
      retiroDoc.fecha,
      retiroDoc.cuentaBancaria as any,
      retiroDoc.monto,
      retiroDoc.descripcion,
      retiroDoc.observaciones,
      (retiroDoc as any).createdAt || new Date(),
      (retiroDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(retiro: RetiroSocio): Partial<RetiroSocioMongo> {
    const doc: any = {
      fecha: retiro.fecha,
      cuentaBancaria: retiro.cuentaBancaria,
      monto: retiro.monto,
      descripcion: retiro.descripcion,
      observaciones: retiro.observaciones,
    };

    if (retiro.id) {
      (doc as any)._id = retiro.id;
    }

    return doc;
  }
}








