import { Inject, Injectable } from '@nestjs/common';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { RegistrarPagoDirectoClienteDto } from '../../dtos/cliente/registrar-pago-directo-cliente.dto';

@Injectable()
export class RegistrarPagoDirectoClienteUseCase {
  constructor(
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteClienteRepository,
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(clienteId: string, dto: RegistrarPagoDirectoClienteDto, usuarioId?: string): Promise<void> {
    const cliente = await this.clienteRepository.findById(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    if (!cliente.tieneCuentaCorriente) {
      throw new Error('El cliente no tiene cuenta corriente habilitada');
    }

    const deudaActual = await this.movimientoRepository.getUltimoSaldo(clienteId);
    
    if (dto.monto <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    if (dto.monto > deudaActual) {
      throw new Error(`El monto del pago ($${dto.monto}) excede la deuda actual ($${deudaActual})`);
    }

    // Actualizar saldo del cliente
    cliente.reducirDeuda(dto.monto);
    await this.clienteRepository.save(cliente);

    // Crear movimiento de cuenta corriente con auditoría (fecha y hora automática)
    const saldoAnterior = deudaActual;
    const tipoMovimiento = dto.monto >= deudaActual
      ? TipoMovimientoCC.PAGO_COMPLETO
      : TipoMovimientoCC.PAGO_PARCIAL;

    const movimiento = MovimientoCuentaCorrienteCliente.crear({
      clienteId: clienteId,
      tipo: tipoMovimiento,
      fecha: new Date(), // Fecha y hora del pago (auditoría)
      monto: dto.monto,
      descripcion: dto.descripcion || `Pago ${tipoMovimiento === TipoMovimientoCC.PAGO_COMPLETO ? 'total' : 'parcial'} de cuenta corriente`,
      saldoAnterior,
      observaciones: dto.observaciones,
      usuarioId, // Usuario que registró el pago (auditoría)
    });

    await this.movimientoRepository.save(movimiento);
  }
}


