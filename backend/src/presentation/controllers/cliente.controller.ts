import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateClienteUseCase } from '../../application/use-cases/cliente/create-cliente.use-case';
import { GetAllClientesUseCase } from '../../application/use-cases/cliente/get-all-clientes.use-case';
import { CreateClienteDto } from '../../application/dtos/cliente/create-cliente.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly getAllClientesUseCase: GetAllClientesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  findAll() {
    return this.getAllClientesUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    // TODO: Implementar GetClienteByIdUseCase
    return null;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.createClienteUseCase.execute(createClienteDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id') id: string, @Body() dto: any) {
    // TODO: Implementar UpdateClienteUseCase
    return null;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  remove(@Param('id') id: string) {
    // TODO: Implementar DeleteClienteUseCase
    return null;
  }
}
