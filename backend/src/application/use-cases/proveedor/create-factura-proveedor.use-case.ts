import { Inject, Injectable } from '@nestjs/common';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { IRemitoProveedorRepository } from '../../ports/remito-proveedor.repository.interface';
import { IMovimientoCuentaCorrienteRepository } from '../../ports/movimiento-cuenta-corriente.repository.interface';
import { FacturaProveedor } from '../../../domain/entities/factura-proveedor.entity';
import { DetalleFacturaProveedor } from '../../../domain/entities/detalle-factura-proveedor.entity';
import { MovimientoCuentaCorriente } from '../../../domain/entities/movimiento-cuenta-corriente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';

export interface CreateFacturaProveedorDto {
  proveedorId: string;
  numero: string;
  fecha: string;
  fechaVencimiento: string;
  detalles: Array<{
    productoId?: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    iva?: number;
    observaciones?: string;
  }>;
  remitoId?: string;
  ordenCompraId?: string;
  observaciones?: string;
}

@Injectable()
export class CreateFacturaProveedorUseCase {
  constructor(
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
    @Inject('IRemitoProveedorRepository')
    private readonly remitoRepository: IRemitoProveedorRepository,
    @Inject('IMovimientoCuentaCorrienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteRepository,
  ) {}

  async execute(dto: CreateFacturaProveedorDto): Promise<FacturaProveedor> {
    // Validar proveedor
    const proveedor = await this.proveedorRepository.findById(dto.proveedorId);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    // Validar remito si existe
    if (dto.remitoId) {
      const remito = await this.remitoRepository.findById(dto.remitoId);
      if (!remito) {
        throw new Error('Remito no encontrado');
      }
      if (remito.facturado) {
        throw new Error('El remito ya está facturado');
      }
    }

    // Crear detalles
    const detalles = dto.detalles.map((det) =>
      DetalleFacturaProveedor.crear({
        productoId: det.productoId,
        codigoProducto: det.codigoProducto,
        nombreProducto: det.nombreProducto,
        cantidad: det.cantidad,
        precioUnitario: det.precioUnitario,
        descuento: det.descuento || 0,
        iva: det.iva || 0,
        observaciones: det.observaciones,
      }),
    );

    // Crear factura
    const factura = FacturaProveedor.crear({
      numero: dto.numero,
      proveedorId: dto.proveedorId,
      fecha: new Date(dto.fecha),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      detalles,
      remitoId: dto.remitoId,
      ordenCompraId: dto.ordenCompraId,
      observaciones: dto.observaciones,
    });

    const facturaGuardada = await this.facturaRepository.save(factura);

    // Si hay remito asociado, marcarlo como facturado
    if (dto.remitoId) {
      const remito = await this.remitoRepository.findById(dto.remitoId);
      if (remito) {
        remito.marcarFacturado(facturaGuardada.id!);
        await this.remitoRepository.save(remito);
      }
    }

    // Crear movimiento de cuenta corriente
    const saldoAnterior = await this.movimientoRepository.getUltimoSaldo(dto.proveedorId);
    const movimiento = MovimientoCuentaCorriente.crear({
      proveedorId: dto.proveedorId,
      tipo: TipoMovimientoCC.FACTURA,
      fecha: facturaGuardada.fecha,
      monto: facturaGuardada.calcularTotal(),
      descripcion: `Factura ${facturaGuardada.numero}`,
      documentoId: facturaGuardada.id,
      documentoNumero: facturaGuardada.numero,
      saldoAnterior,
      observaciones: dto.observaciones,
    });

    await this.movimientoRepository.save(movimiento);

    return facturaGuardada;
  }
}

