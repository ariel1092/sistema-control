import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateProveedorUseCase } from '../../application/use-cases/proveedor/create-proveedor.use-case';
import { GetProveedoresUseCase } from '../../application/use-cases/proveedor/get-proveedores.use-case';
import { GetProveedorUseCase } from '../../application/use-cases/proveedor/get-proveedor.use-case';
import { UpdateProveedorUseCase } from '../../application/use-cases/proveedor/update-proveedor.use-case';
import { DeleteProveedorUseCase } from '../../application/use-cases/proveedor/delete-proveedor.use-case';
import { CreateFacturaProveedorUseCase } from '../../application/use-cases/proveedor/create-factura-proveedor.use-case';
import { RegistrarPagoProveedorUseCase } from '../../application/use-cases/proveedor/registrar-pago-proveedor.use-case';
import { GetCuentaCorrienteProveedorUseCase } from '../../application/use-cases/proveedor/get-cuenta-corriente-proveedor.use-case';
import { GetFacturasProveedorUseCase } from '../../application/use-cases/proveedor/get-facturas-proveedor.use-case';
import { GetFacturaByIdUseCase } from '../../application/use-cases/proveedor/get-factura-by-id.use-case';
import { CreateProveedorDto } from '../../application/dtos/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../../application/dtos/proveedor/update-proveedor.dto';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedorController {
  constructor(
    private readonly createProveedorUseCase: CreateProveedorUseCase,
    private readonly getProveedoresUseCase: GetProveedoresUseCase,
    private readonly getProveedorUseCase: GetProveedorUseCase,
    private readonly updateProveedorUseCase: UpdateProveedorUseCase,
    private readonly deleteProveedorUseCase: DeleteProveedorUseCase,
    private readonly createFacturaProveedorUseCase: CreateFacturaProveedorUseCase,
    private readonly registrarPagoProveedorUseCase: RegistrarPagoProveedorUseCase,
    private readonly getCuentaCorrienteProveedorUseCase: GetCuentaCorrienteProveedorUseCase,
    private readonly getFacturasProveedorUseCase: GetFacturasProveedorUseCase,
    private readonly getFacturaByIdUseCase: GetFacturaByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proveedores' })
  findAll() {
    return this.getProveedoresUseCase.execute();
  }

  // Rutas específicas deben ir antes de las genéricas
  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener una factura por ID' })
  @ApiResponse({ status: 200, description: 'Detalle completo de la factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async getFacturaById(@Param('id') id: string) {
    return this.getFacturaByIdUseCase.execute(id);
  }

  @Get(':id/cuenta-corriente')
  @ApiOperation({ summary: 'Obtener cuenta corriente de un proveedor' })
  getCuentaCorriente(@Param('id') id: string) {
    return this.getCuentaCorrienteProveedorUseCase.execute(id);
  }

  @Get(':id/facturas')
  @ApiOperation({ summary: 'Obtener todas las facturas de un proveedor' })
  @ApiResponse({ status: 200, description: 'Lista de facturas del proveedor' })
  async getFacturas(@Param('id') id: string) {
    console.log(`[ProveedorController] GET /proveedores/${id}/facturas`);
    const facturas = await this.getFacturasProveedorUseCase.execute(id);
    console.log(`[ProveedorController] Devolviendo ${facturas.length} facturas`);
    return facturas;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  findOne(@Param('id') id: string) {
    return this.getProveedorUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.createProveedorUseCase.execute(createProveedorDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  update(@Param('id') id: string, @Body() updateProveedorDto: UpdateProveedorDto) {
    return this.updateProveedorUseCase.execute(id, updateProveedorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  remove(@Param('id') id: string) {
    return this.deleteProveedorUseCase.execute(id);
  }

  @Post(':id/facturas')
  @ApiOperation({ summary: 'Crear una nueva factura para un proveedor' })
  createFactura(@Param('id') id: string, @Body() dto: any) {
    return this.createFacturaProveedorUseCase.execute({
      ...dto,
      proveedorId: id,
    });
  }

  @Post('facturas/:id/pago')
  @ApiOperation({ summary: 'Registrar un pago de factura' })
  registrarPago(@Param('id') id: string, @Body() dto: any) {
    return this.registrarPagoProveedorUseCase.execute({
      facturaId: id,
      monto: dto.monto,
      descripcion: dto.descripcion,
      observaciones: dto.observaciones,
    });
  }
}
