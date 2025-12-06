import { GastoDiario, MetodoPagoGasto, CategoriaGasto } from '../../../../domain/entities/gasto-diario.entity';
import { GastoDiarioMongo, GastoDiarioDocument } from '../schemas/gasto-diario.schema';
import { CuentaBancaria } from '../../../../domain/enums/cuenta-bancaria.enum';

export class GastoDiarioMapper {
  static toDomain(gastoDoc: GastoDiarioDocument): GastoDiario {
    if (!gastoDoc) return null;

    // Mapear método de pago antiguo a nuevo
    let metodoPago: MetodoPagoGasto;
    const metodoPagoDoc = gastoDoc.metodoPago as string;
    if (metodoPagoDoc === 'TRANSFERENCIA' || metodoPagoDoc === 'MERCADOPAGO') {
      metodoPago = MetodoPagoGasto.MERCADOPAGO;
    } else if (metodoPagoDoc === 'CAJA') {
      metodoPago = MetodoPagoGasto.EFECTIVO;
    } else {
      metodoPago = metodoPagoDoc as MetodoPagoGasto;
    }

    // Mapear categoría (por si hay valores antiguos)
    let categoria: CategoriaGasto;
    const categoriaDoc = gastoDoc.categoria as string;
    if (Object.values(CategoriaGasto).includes(categoriaDoc as CategoriaGasto)) {
      categoria = categoriaDoc as CategoriaGasto;
    } else {
      // Si la categoría no es válida, usar OTROS como fallback
      categoria = CategoriaGasto.OTROS;
    }

    return new GastoDiario(
      gastoDoc._id.toString(),
      gastoDoc.fecha,
      categoria,
      gastoDoc.monto,
      gastoDoc.descripcion,
      gastoDoc.empleadoNombre,
      metodoPago,
      gastoDoc.observaciones,
      gastoDoc.cuentaBancaria as CuentaBancaria | undefined,
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

    if (gasto.cuentaBancaria) {
      doc.cuentaBancaria = gasto.cuentaBancaria;
    }

    if (gasto.id) {
      (doc as any)._id = gasto.id;
    }

    return doc;
  }
}

