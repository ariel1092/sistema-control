import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateClienteUseCase } from '../../application/use-cases/cliente/create-cliente.use-case';
import { GetAllClientesUseCase } from '../../application/use-cases/cliente/get-all-clientes.use-case';
import { CreateFacturaClienteUseCase } from '../../application/use-cases/cliente/create-factura-cliente.use-case';
import { GetFacturasClienteUseCase } from '../../application/use-cases/cliente/get-facturas-cliente.use-case';
import { RegistrarPagoClienteUseCase } from '../../application/use-cases/cliente/registrar-pago-cliente.use-case';
import { RegistrarPagoDirectoClienteUseCase } from '../../application/use-cases/cliente/registrar-pago-directo-cliente.use-case';
import { GetCuentaCorrienteClienteUseCase } from '../../application/use-cases/cliente/get-cuenta-corriente-cliente.use-case';
import { CreateClienteDto } from '../../application/dtos/cliente/create-cliente.dto';
import { CreateFacturaClienteDto } from '../../application/dtos/cliente/create-factura-cliente.dto';
import { RegistrarPagoClienteDto } from '../../application/dtos/cliente/registrar-pago-cliente.dto';
import { RegistrarPagoDirectoClienteDto } from '../../application/dtos/cliente/registrar-pago-directo-cliente.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly getAllClientesUseCase: GetAllClientesUseCase,
    private readonly createFacturaClienteUseCase: CreateFacturaClienteUseCase,
    private readonly getFacturasClienteUseCase: GetFacturasClienteUseCase,
    private readonly registrarPagoClienteUseCase: RegistrarPagoClienteUseCase,
    private readonly registrarPagoDirectoClienteUseCase: RegistrarPagoDirectoClienteUseCase,
    private readonly getCuentaCorrienteClienteUseCase: GetCuentaCorrienteClienteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  findAll() {
    return this.getAllClientesUseCase.execute();
  }

  // Rutas específicas deben ir ANTES de las genéricas
  @Post('facturas/:id/pago')
  @ApiOperation({ summary: 'Registrar un pago de factura de cliente' })
  registrarPago(@Param('id') id: string, @Body() dto: RegistrarPagoClienteDto, @Request() req: any) {
    const usuarioId = req.user?.id;
    return this.registrarPagoClienteUseCase.execute({
      facturaId: id,
      ...dto,
    }, usuarioId);
  }

  @Post(':id/pago-directo')
  @ApiOperation({ summary: 'Registrar un pago directo a la cuenta corriente del cliente (total o parcial)' })
  registrarPagoDirecto(@Param('id') id: string, @Body() dto: RegistrarPagoDirectoClienteDto, @Request() req: any) {
    const usuarioId = req.user?.id;
    return this.registrarPagoDirectoClienteUseCase.execute(id, dto, usuarioId);
  }

  @Get(':id/cuenta-corriente')
  @ApiOperation({ summary: 'Obtener cuenta corriente de un cliente' })
  getCuentaCorriente(@Param('id') id: string) {
    return this.getCuentaCorrienteClienteUseCase.execute(id);
  }

  @Get(':id/facturas')
  @ApiOperation({ summary: 'Obtener todas las facturas de un cliente' })
  getFacturas(@Param('id') id: string) {
    return this.getFacturasClienteUseCase.execute(id);
  }

  @Post(':id/facturas')
  @ApiOperation({ summary: 'Crear una nueva factura para un cliente' })
  createFactura(@Param('id') id: string, @Body() dto: CreateFacturaClienteDto, @Request() req: any) {
    const usuarioId = req.user?.id;
    return this.createFacturaClienteUseCase.execute({
      ...dto,
      clienteId: id,
    }, usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    // TODO: Implementar GetClienteByIdUseCase
    return null;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() createClienteDto: CreateClienteDto, @Request() req: any) {
    const usuarioId = req.user?.id;
    return this.createClienteUseCase.execute(createClienteDto, usuarioId);
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
