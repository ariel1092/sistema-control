import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IComprobanteFiscalRepository } from '../../ports/comprobante-fiscal.repository.interface';
import { ObtenerSiguienteNumeroFiscalUseCase } from './obtener-siguiente-numero-fiscal.use-case';
import { ComprobanteFiscal } from '../../../domain/entities/comprobante-fiscal.entity';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { LetraComprobante } from '../../../domain/enums/letra-comprobante.enum';
import { TipoComprobanteFiscal } from '../../../domain/enums/tipo-comprobante-fiscal.enum';
import { ItemFiscal } from '../../../domain/value-objects/item-fiscal.vo';
import { ReceptorFiscal, TipoDocumentoFiscal } from '../../../domain/value-objects/receptor-fiscal.vo';
import { TotalesFiscales } from '../../../domain/value-objects/totales-fiscales.vo';

export type DatosEmisorFiscalDto = {
  razonSocial: string;
  cuit: string; // 11 dígitos
  domicilioFiscal: string;
  condicionIva?: string;
  ingresosBrutos?: string;
  inicioActividades?: string;
};

export type DatosReceptorFiscalDto = {
  nombreRazonSocial: string;
  tipoDocumento: TipoDocumentoFiscal;
  numeroDocumento?: string;
  domicilio?: string;
};

/**
 * Fase 4: Emisión interna (sin AFIP).
 * - Crea comprobante en estado BORRADOR o EMITIDO (según política).
 * - Numeración fiscal secuencial obligatoriamente transaccional.
 */
@Injectable()
export class EmitirComprobanteFiscalUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IComprobanteFiscalRepository')
    private readonly comprobanteRepository: IComprobanteFiscalRepository,
    private readonly obtenerSiguienteNumeroFiscalUseCase: ObtenerSiguienteNumeroFiscalUseCase,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(params: {
    ventaId: string;
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    emisor: DatosEmisorFiscalDto;
    receptor: DatosReceptorFiscalDto;
    /**
     * Estado objetivo en esta fase (sin AFIP). Si se omite, BORRADOR.
     * PENDIENTE_AFIP deja el comprobante listo para futura autorización.
     */
    estado?: 'BORRADOR' | 'PENDIENTE_AFIP';
  }, options: { session: any }): Promise<ComprobanteFiscal> {
    const session = options?.session;
    if (!session) {
      throw new Error('EmitirComprobanteFiscalUseCase requiere session (transacción obligatoria)');
    }
    if (typeof session.inTransaction === 'function' && !session.inTransaction()) {
      throw new Error('EmitirComprobanteFiscalUseCase debe ejecutarse dentro de una transacción Mongo');
    }

        // 1) Validar venta
        const venta = await this.ventaRepository.findById(params.ventaId);
        if (!venta) {
          throw new Error('Venta no encontrada');
        }
        if (venta.estado !== EstadoVenta.COMPLETADA) {
          throw new Error('La venta debe estar COMPLETADA para emitir un comprobante fiscal');
        }

        // 2) Validar que no exista ya un comprobante para esa venta (1:1)
        const existente = await this.comprobanteRepository.findByVentaId(params.ventaId);
        if (existente) {
          throw new Error('Ya existe un comprobante fiscal para esta venta');
        }

        // 3) Numeración fiscal (secuencial, atómico, dentro de la misma transacción)
        const { numero } = await this.obtenerSiguienteNumeroFiscalUseCase.execute(
          {
            puntoVenta: params.puntoVenta,
            tipo: params.tipo,
            letra: params.letra,
          },
          { session },
        );

        // 4) Snapshot emisor y receptor
        const emisorSnapshot = {
          razonSocial: params.emisor.razonSocial,
          cuit: params.emisor.cuit,
          domicilioFiscal: params.emisor.domicilioFiscal,
          condicionIva: params.emisor.condicionIva,
          ingresosBrutos: params.emisor.ingresosBrutos,
          inicioActividades: params.emisor.inicioActividades,
        } as const;

        const receptorVo = ReceptorFiscal.crear({
          nombreRazonSocial: params.receptor.nombreRazonSocial,
          tipoDocumento: params.receptor.tipoDocumento,
          numeroDocumento: params.receptor.numeroDocumento,
          domicilio: params.receptor.domicilio,
        });

        // 5) Mapear items venta -> items fiscales
        if (!venta.detalles || venta.detalles.length === 0) {
          throw new Error('La venta no tiene detalles. No se puede emitir comprobante fiscal sin ítems');
        }

        const itemsFiscales = venta.detalles.map((d) =>
          ItemFiscal.crear({
            productoId: d.productoId,
            codigo: d.codigoProducto,
            descripcion: d.nombreProducto,
            unidad: 'UN',
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuentoPorcentaje: d.descuentoItem,
            alicuotaIva: 21, // sin AFIP: default
          }),
        );

        // 6) Totales fiscales
        const totales = TotalesFiscales.desdeItems({ items: itemsFiscales });

        // 7) Crear y guardar comprobante (BORRADOR por defecto)
        const comprobante = ComprobanteFiscal.crearBorrador({
          ventaId: params.ventaId,
          tipo: params.tipo,
          letra: params.letra,
          puntoVenta: params.puntoVenta,
          numero,
          fechaEmision: new Date(),
          emisor: emisorSnapshot,
          receptor: receptorVo,
          items: itemsFiscales,
          totales,
        });

        const finalEntity =
          params.estado === 'PENDIENTE_AFIP'
            ? comprobante.emitir()
            : comprobante;

    return await this.comprobanteRepository.save(finalEntity, { session });
  }
}


