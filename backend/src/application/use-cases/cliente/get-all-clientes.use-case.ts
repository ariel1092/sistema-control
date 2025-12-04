import { Injectable, Inject } from '@nestjs/common';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { ClienteResponseDto } from '../../dtos/cliente/cliente-response.dto';

@Injectable()
export class GetAllClientesUseCase {
  constructor(
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(): Promise<ClienteResponseDto[]> {
    const clientes = await this.clienteRepository.findAll();
    return clientes.map(this.mapToResponse);
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










