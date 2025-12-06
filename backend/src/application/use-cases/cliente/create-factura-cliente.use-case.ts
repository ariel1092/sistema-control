import { Inject, Injectable } from '@nestjs/common';
import { IFacturaClienteRepository } from '../../ports/factura-cliente.repository.interface';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { FacturaCliente } from '../../../domain/entities/factura-cliente.entity';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { CreateFacturaClienteDto } from '../../dtos/cliente/create-factura-cliente.dto';

@Injectable()
export class CreateFacturaClienteUseCase {
  constructor(
    @Inject('IFacturaClienteRepository')
    private readonly facturaRepository: IFacturaClienteRepository,
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteClienteRepository,
  ) {}

  async execute(dto: CreateFacturaClienteDto, usuarioId?: string): Promise<FacturaCliente> {
    // Validar cliente
    const cliente = await this.clienteRepository.findById(dto.clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    if (!cliente.tieneCuentaCorriente) {
      throw new Error('El cliente no tiene cuenta corriente habilitada');
    }

    // Crear factura
    const factura = FacturaCliente.crear({
      numero: dto.numero,
      clienteId: dto.clienteId,
      fecha: new Date(dto.fecha),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      montoTotal: dto.montoTotal,
      descripcion: dto.descripcion,
      observaciones: dto.observaciones,
      ventaId: dto.ventaId,
    });

    const facturaGuardada = await this.facturaRepository.save(factura);

    // Actualizar saldo del cliente
    cliente.agregarDeuda(facturaGuardada.montoTotal);
    await this.clienteRepository.save(cliente);

    // Crear movimiento de cuenta corriente
    const saldoAnterior = await this.movimientoRepository.getUltimoSaldo(dto.clienteId);
    const movimiento = MovimientoCuentaCorrienteCliente.crear({
      clienteId: dto.clienteId,
      tipo: TipoMovimientoCC.FACTURA,
      fecha: facturaGuardada.fecha,
      monto: facturaGuardada.montoTotal,
      descripcion: dto.descripcion || `Factura ${facturaGuardada.numero}`,
      documentoId: facturaGuardada.id,
      documentoNumero: facturaGuardada.numero,
      saldoAnterior,
      observaciones: dto.observaciones,
      usuarioId,
    });

    await this.movimientoRepository.save(movimiento);

    return facturaGuardada;
  }
}


