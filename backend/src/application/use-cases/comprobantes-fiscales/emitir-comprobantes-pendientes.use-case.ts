import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EmitirComprobanteFiscalUseCase, DatosEmisorFiscalDto } from './emitir-comprobante-fiscal.use-case';
import { TipoComprobanteFiscal } from '../../../domain/enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../domain/enums/letra-comprobante.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IComprobanteFiscalRepository } from '../../ports/comprobante-fiscal.repository.interface';
import { RegistrarAuditoriaUseCase } from '../auditoria/registrar-auditoria.use-case';
import { TipoEventoAuditoria } from '../../../domain/enums/tipo-evento-auditoria.enum';
import { TipoDocumentoFiscal } from '../../../domain/value-objects/receptor-fiscal.vo';

@Injectable()
export class EmitirComprobantesPendientesUseCase {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject('IVentaRepository') private readonly ventaRepository: IVentaRepository,
    @Inject('IComprobanteFiscalRepository') private readonly comprobanteRepository: IComprobanteFiscalRepository,
    private readonly emitirComprobanteFiscalUseCase: EmitirComprobanteFiscalUseCase,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  /**
   * Comando interno:
   * - Busca ventas COMPLETADAS sin comprobante fiscal
   * - Emite comprobante en estado PENDIENTE_AFIP (sin AFIP)
   * - Transacción obligatoria por emisión
   * - Auditoría por emisión
   */
  async execute(params: {
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    emisor: DatosEmisorFiscalDto;
    usuarioId: string;
    /**
     * Límite de procesamiento por corrida (protección operativa).
     */
    max?: number;
  }): Promise<{
    procesadas: number;
    emitidas: number;
    omitidas: number;
    errores: Array<{ ventaId: string; error: string }>;
  }> {
    const max = params.max ?? 200;

    // 1) Obtener candidatas (lectura fuera de transacción)
    const ventaIds = await this.buscarVentasCompletadasSinComprobante(max);

    let emitidas = 0;
    let omitidas = 0;
    const errores: Array<{ ventaId: string; error: string }> = [];

    for (const ventaId of ventaIds) {
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          if (typeof session.inTransaction === 'function' && !session.inTransaction()) {
            throw new Error('Emisión debe ejecutarse dentro de transacción Mongo');
          }

          // Revalidación dentro de TX para evitar carrera (otra corrida podría emitir antes)
          const venta = await this.ventaRepository.findById(ventaId);
          if (!venta || venta.estado !== EstadoVenta.COMPLETADA) {
            omitidas++;
            return;
          }
          const ya = await this.comprobanteRepository.findByVentaId(ventaId);
          if (ya) {
            omitidas++;
            return;
          }

          // Receptor: si hay DNI en venta usamos DNI; si no, Consumidor Final.
          const receptorNombre = venta.clienteNombre || 'CONSUMIDOR FINAL';
          const tieneDni = Boolean(venta.clienteDNI && venta.clienteDNI.trim().length > 0);

          const comprobante = await this.emitirComprobanteFiscalUseCase.execute(
            {
              ventaId,
              puntoVenta: params.puntoVenta,
              tipo: params.tipo,
              letra: params.letra,
              emisor: params.emisor,
              receptor: {
                nombreRazonSocial: receptorNombre,
                tipoDocumento: tieneDni ? TipoDocumentoFiscal.DNI : TipoDocumentoFiscal.SIN_IDENTIFICAR,
                numeroDocumento: tieneDni ? venta.clienteDNI : undefined,
                domicilio: undefined,
              },
              estado: 'PENDIENTE_AFIP',
            },
            { session },
          );

          // Auditoría por emisión (dentro de la misma TX)
          await this.registrarAuditoriaUseCase.execute(
            {
              entidad: 'comprobante_fiscal',
              entidadId: comprobante.id!,
              evento: TipoEventoAuditoria.CREACION,
              snapshot: {
                ventaId: comprobante.ventaId,
                tipo: comprobante.tipo,
                letra: comprobante.letra,
                puntoVenta: comprobante.puntoVenta,
                numero: comprobante.numero,
                estado: comprobante.estado,
                fechaEmision: comprobante.fechaEmision,
                emisor: comprobante.emisor,
                receptor: comprobante.receptor,
                totales: comprobante.totales,
              },
              usuarioId: params.usuarioId,
              razon: 'Emisión automática PENDIENTE_AFIP (sin AFIP)',
            },
            { session },
          );

          emitidas++;
        });
      } catch (e: any) {
        errores.push({ ventaId, error: e?.message || 'Error desconocido' });
      } finally {
        await session.endSession();
      }
    }

    return {
      procesadas: ventaIds.length,
      emitidas,
      omitidas,
      errores,
    };
  }

  /**
   * Obtiene IDs de ventas COMPLETADAS sin comprobante fiscal usando $lookup.
   * No modifica colecciones; solo lectura eficiente.
   */
  private async buscarVentasCompletadasSinComprobante(limit: number): Promise<string[]> {
    const ventasCol = this.connection.collection('ventas');
    const cursor = ventasCol.aggregate([
      { $match: { estado: EstadoVenta.COMPLETADA } },
      { $addFields: { ventaIdStr: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'comprobantes_fiscales',
          localField: 'ventaIdStr',
          foreignField: 'ventaId',
          as: 'cf',
        },
      },
      { $match: { cf: { $size: 0 } } },
      { $sort: { createdAt: 1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]);

    const docs = await cursor.toArray();
    return docs.map((d: any) => d._id.toString());
  }
}





