import { Inject, Injectable } from '@nestjs/common';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { Venta } from '../../../domain/entities/venta.entity';

@Injectable()
export class RegistrarMovimientoCCVentaUseCase {
  constructor(
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoCCRepository: IMovimientoCuentaCorrienteClienteRepository,
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
  ) { }

  async ejecutarCargoPorVenta(params: {
    venta: Venta;
    clienteDNI: string;
    usuarioId?: string;
  }, options?: { session?: any }): Promise<void> {
    const { venta, clienteDNI, usuarioId } = params;
    const session = options?.session;

    const cliente = await this.clienteRepository.findByDNI(clienteDNI);
    if (!cliente) {
      throw new Error(`Cliente con DNI ${clienteDNI} no encontrado para registrar cuenta corriente`);
    }
    if (!cliente.tieneCuentaCorriente) {
      throw new Error(`El cliente con DNI ${clienteDNI} no tiene cuenta corriente habilitada`);
    }

    const saldoAnterior = await this.movimientoCCRepository.getUltimoSaldo(cliente.id!);

    const movimiento = MovimientoCuentaCorrienteCliente.crear({
      clienteId: cliente.id!,
      tipo: TipoMovimientoCC.CARGO, // Semántica corregida
      fecha: venta.fecha,
      monto: venta.calcularTotal(),
      descripcion: `Cargo por Venta ${venta.numero}`,
      documentoId: venta.id,
      documentoNumero: venta.numero,
      saldoAnterior,
      usuarioId,
    });

    await this.movimientoCCRepository.save(movimiento, { session });
    // CARGO = Aumenta deuda
    cliente.agregarDeuda(movimiento.monto);
    await this.clienteRepository.save(cliente, { session });
  }

  async revertirPorVenta(params: {
    venta: Venta;
    usuarioId?: string;
  }, options?: { session?: any }): Promise<void> {
    const { venta, usuarioId } = params;
    const session = options?.session;
    if (!venta.id) return;

    // Buscar movimientos originales vinculados a esta venta
    const movimientos = await this.movimientoCCRepository.findByDocumentoId(venta.id);
    const movimientoOriginal = movimientos.find(m => m.tipo === TipoMovimientoCC.CARGO || m.tipo === TipoMovimientoCC.VENTA); // VENTA support for legacy

    if (!movimientoOriginal || !movimientoOriginal.clienteId) return;

    const cliente = await this.clienteRepository.findById(movimientoOriginal.clienteId);
    if (!cliente) return;

    const saldoAnterior = await this.movimientoCCRepository.getUltimoSaldo(cliente.id!);

    // Crear UN SOLO movimiento de REVERSO
    // Monto negativo para reflejar la anulación del cargo
    const montoReverso = -Math.abs(movimientoOriginal.monto);

    const reverso = MovimientoCuentaCorrienteCliente.crear({
      clienteId: cliente.id!,
      tipo: TipoMovimientoCC.REVERSO,
      fecha: new Date(),
      monto: montoReverso,
      descripcion: `Reversión Cargo Venta ${venta.numero}`,
      documentoId: venta.id,
      documentoNumero: venta.numero,
      saldoAnterior,
      observaciones: 'Anulación automática por cancelación de venta',
      usuarioId,
    });

    await this.movimientoCCRepository.save(reverso, { session });
    // REVERSO negativo = Reducir deuda (agregar un negativo es restar)
    cliente.agregarDeuda(montoReverso);
    await this.clienteRepository.save(cliente, { session });
  }
}


