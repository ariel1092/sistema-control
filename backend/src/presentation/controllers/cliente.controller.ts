import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateClienteUseCase } from '../../application/use-cases/cliente/create-cliente.use-case';
import { GetAllClientesUseCase } from '../../application/use-cases/cliente/get-all-clientes.use-case';
import { CreateClienteDto } from '../../application/dtos/cliente/create-cliente.dto';
import { ClienteResponseDto } from '../../application/dtos/cliente/cliente-response.dto';

@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly getAllClientesUseCase: GetAllClientesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClienteDto): Promise<ClienteResponseDto> {
    return await this.createClienteUseCase.execute(dto);
  }

  @Get()
  async findAll(): Promise<ClienteResponseDto[]> {
    return await this.getAllClientesUseCase.execute();
  }
}



