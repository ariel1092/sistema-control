import { Inject, Injectable } from '@nestjs/common';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { IMovimientoCuentaCorrienteRepository } from '../../ports/movimiento-cuenta-corriente.repository.interface';
import { MovimientoCuentaCorriente } from '../../../domain/entities/movimiento-cuenta-corriente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';

export interface RegistrarPagoProveedorDto {
  facturaId: string;
  monto: number;
  descripcion?: string;
  observaciones?: string;
}

@Injectable()
export class RegistrarPagoProveedorUseCase {
  constructor(
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
    @Inject('IMovimientoCuentaCorrienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteRepository,
  ) {}

  async execute(dto: RegistrarPagoProveedorDto): Promise<void> {
    const factura = await this.facturaRepository.findById(dto.facturaId);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.pagada) {
      throw new Error('La factura ya está pagada completamente');
    }

    const saldoPendiente = factura.calcularSaldoPendiente();
    if (dto.monto > saldoPendiente) {
      throw new Error(`El monto del pago ($${dto.monto}) excede el saldo pendiente ($${saldoPendiente})`);
    }

    // Registrar pago en la factura
    factura.registrarPago(dto.monto);
    await this.facturaRepository.save(factura);

    // Crear movimiento de cuenta corriente
    const saldoAnterior = await this.movimientoRepository.getUltimoSaldo(factura.proveedorId);
    const tipoMovimiento = factura.pagada
      ? TipoMovimientoCC.PAGO_COMPLETO
      : TipoMovimientoCC.PAGO_PARCIAL;

    const movimiento = MovimientoCuentaCorriente.crear({
      proveedorId: factura.proveedorId,
      tipo: tipoMovimiento,
      fecha: new Date(),
      monto: dto.monto,
      descripcion: dto.descripcion || `Pago ${factura.pagada ? 'completo' : 'parcial'} - Factura ${factura.numero}`,
      documentoId: factura.id,
      documentoNumero: factura.numero,
      saldoAnterior,
      observaciones: dto.observaciones,
    });

    await this.movimientoRepository.save(movimiento);
  }
}

