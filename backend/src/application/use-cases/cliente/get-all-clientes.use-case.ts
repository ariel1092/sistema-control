import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { ClienteResponseDto } from '../../dtos/cliente/cliente-response.dto';

@Injectable()
export class GetAllClientesUseCase {
  constructor(
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(): Promise<ClienteResponseDto[]> {
    const cacheKey = 'clientes:all';
    
    // Intentar obtener del caché
    const cached = await this.cacheManager.get<ClienteResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si no está en caché, obtener de la BD
    const clientes = await this.clienteRepository.findAll();
    const response = clientes.map(this.mapToResponse);
    
    // Guardar en caché por 10 minutos (600 segundos)
    await this.cacheManager.set(cacheKey, response, 600);
    
    return response;
  }

  private mapToResponse(cliente: any): ClienteResponseDto {
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










