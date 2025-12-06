import { Inject, Injectable } from '@nestjs/common';
import { IFacturaClienteRepository } from '../../ports/factura-cliente.repository.interface';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { RegistrarPagoClienteDto } from '../../dtos/cliente/registrar-pago-cliente.dto';

@Injectable()
export class RegistrarPagoClienteUseCase {
  constructor(
    @Inject('IFacturaClienteRepository')
    private readonly facturaRepository: IFacturaClienteRepository,
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteClienteRepository,
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(dto: RegistrarPagoClienteDto, usuarioId?: string): Promise<void> {
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

    // Actualizar saldo del cliente
    const cliente = await this.clienteRepository.findById(factura.clienteId);
    if (cliente) {
      cliente.reducirDeuda(dto.monto);
      await this.clienteRepository.save(cliente);
    }

    // Crear movimiento de cuenta corriente con auditoría (fecha y hora automática)
    const saldoAnterior = await this.movimientoRepository.getUltimoSaldo(factura.clienteId);
    const tipoMovimiento = factura.pagada
      ? TipoMovimientoCC.PAGO_COMPLETO
      : TipoMovimientoCC.PAGO_PARCIAL;

    const movimiento = MovimientoCuentaCorrienteCliente.crear({
      clienteId: factura.clienteId,
      tipo: tipoMovimiento,
      fecha: new Date(), // Fecha y hora del pago (auditoría)
      monto: dto.monto,
      descripcion: dto.descripcion || `Pago ${factura.pagada ? 'completo' : 'parcial'} - Factura ${factura.numero}`,
      documentoId: factura.id,
      documentoNumero: factura.numero,
      saldoAnterior,
      observaciones: dto.observaciones,
      usuarioId, // Usuario que registró el pago (auditoría)
    });

    await this.movimientoRepository.save(movimiento);
  }
}


