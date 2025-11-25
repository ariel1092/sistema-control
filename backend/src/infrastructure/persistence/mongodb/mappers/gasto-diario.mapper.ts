import { GastoDiario } from '../../../../domain/entities/gasto-diario.entity';
import { GastoDiarioMongo, GastoDiarioDocument } from '../schemas/gasto-diario.schema';

export class GastoDiarioMapper {
  static toDomain(gastoDoc: GastoDiarioDocument): GastoDiario {
    if (!gastoDoc) return null;

    return new GastoDiario(
      gastoDoc._id.toString(),
      gastoDoc.fecha,
      gastoDoc.categoria as any,
      gastoDoc.monto,
      gastoDoc.descripcion,
      gastoDoc.empleadoNombre,
      gastoDoc.metodoPago as any,
      gastoDoc.observaciones,
      (gastoDoc as any).createdAt || new Date(),
      (gastoDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(gasto: GastoDiario): Partial<GastoDiarioMongo> {
    const doc: any = {
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      monto: gasto.monto,
      descripcion: gasto.descripcion,
      empleadoNombre: gasto.empleadoNombre,
      metodoPago: gasto.metodoPago,
      observaciones: gasto.observaciones,
    };

    if (gasto.id) {
      (doc as any)._id = gasto.id;
    }

    return doc;
  }
}

