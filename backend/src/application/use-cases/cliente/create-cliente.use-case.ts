import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { Cliente } from '../../../domain/entities/cliente.entity';
import { CreateClienteDto } from '../../dtos/cliente/create-cliente.dto';
import { ClienteResponseDto } from '../../dtos/cliente/cliente-response.dto';

@Injectable()
export class CreateClienteUseCase {
  constructor(
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(dto: CreateClienteDto): Promise<ClienteResponseDto> {
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










