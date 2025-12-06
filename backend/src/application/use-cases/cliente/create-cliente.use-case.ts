import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { Cliente } from '../../../domain/entities/cliente.entity';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { CreateClienteDto } from '../../dtos/cliente/create-cliente.dto';
import { ClienteResponseDto } from '../../dtos/cliente/cliente-response.dto';

@Injectable()
export class CreateClienteUseCase {
  constructor(
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteClienteRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(dto: CreateClienteDto, usuarioId?: string): Promise<ClienteResponseDto> {
    // Verificar si ya existe un cliente con el mismo DNI
    if (dto.dni) {
      const clienteExistente = await this.clienteRepository.findByDNI(dto.dni);
      if (clienteExistente) {
        throw new Error('Ya existe un cliente con este DNI');
      }
    }

    const cliente = Cliente.crear({
      nombre: dto.nombre,
      razonSocial: dto.razonSocial,
      dni: dto.dni,
      telefono: dto.telefono,
      email: dto.email,
      direccion: dto.direccion,
      observaciones: dto.observaciones,
      tieneCuentaCorriente: dto.tieneCuentaCorriente || false,
      saldoCuentaCorriente: dto.saldoCuentaCorriente || 0,
    });

    const clienteGuardado = await this.clienteRepository.save(cliente);

    // Si tiene cuenta corriente y hay un monto inicial, crear movimiento inicial
    if (clienteGuardado.tieneCuentaCorriente && dto.saldoCuentaCorriente && dto.saldoCuentaCorriente > 0) {
      const movimiento = MovimientoCuentaCorrienteCliente.crear({
        clienteId: clienteGuardado.id!,
        tipo: TipoMovimientoCC.FACTURA,
        fecha: new Date(),
        monto: dto.saldoCuentaCorriente,
        descripcion: `Saldo inicial de cuenta corriente`,
        saldoAnterior: 0,
        observaciones: 'Saldo inicial al crear el cliente',
        usuarioId,
      });

      await this.movimientoRepository.save(movimiento);
    }

    // Invalidar caché de clientes
    await this.cacheManager.del('clientes:all');

    return this.mapToResponse(clienteGuardado);
  }

  private mapToResponse(cliente: Cliente): ClienteResponseDto {
    return {
      id: cliente.id!,
      nombre: cliente.nombre,
      razonSocial: cliente.razonSocial,
      dni: cliente.dni,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      observaciones: cliente.observaciones,
      tieneCuentaCorriente: cliente.tieneCuentaCorriente,
      saldoCuentaCorriente: cliente.saldoCuentaCorriente,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };
  }
}










