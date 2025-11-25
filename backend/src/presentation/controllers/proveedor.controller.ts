import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateProveedorUseCase } from '../../application/use-cases/proveedor/create-proveedor.use-case';
import { GetProveedoresUseCase } from '../../application/use-cases/proveedor/get-proveedores.use-case';
import { GetProveedorUseCase } from '../../application/use-cases/proveedor/get-proveedor.use-case';
import { UpdateProveedorUseCase } from '../../application/use-cases/proveedor/update-proveedor.use-case';
import { DeleteProveedorUseCase } from '../../application/use-cases/proveedor/delete-proveedor.use-case';
import { GetCuentaCorrienteProveedorUseCase } from '../../application/use-cases/proveedor/get-cuenta-corriente-proveedor.use-case';
import { CreateOrdenCompraUseCase } from '../../application/use-cases/proveedor/create-orden-compra.use-case';
import { CreateFacturaProveedorUseCase } from '../../application/use-cases/proveedor/create-factura-proveedor.use-case';
import { RegistrarPagoProveedorUseCase } from '../../application/use-cases/proveedor/registrar-pago-proveedor.use-case';
import { CreateProveedorDto } from '../../application/dtos/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../../application/dtos/proveedor/update-proveedor.dto';
import { ProveedorResponseDto } from '../../application/dtos/proveedor/proveedor-response.dto';
import { CuentaCorrienteProveedorDto } from '../../application/dtos/proveedor/cuenta-corriente-proveedor.dto';
import { CreateOrdenCompraDto } from '../../application/dtos/proveedor/create-orden-compra.dto';
import { CreateFacturaProveedorDto } from '../../application/dtos/proveedor/create-factura-proveedor.dto';
import { RegistrarPagoProveedorDto } from '../../application/dtos/proveedor/registrar-pago-proveedor.dto';
import { ProveedorMapper } from '../mappers/proveedor.mapper';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedorController {
  constructor(
    private readonly createProveedorUseCase: CreateProveedorUseCase,
    private readonly getProveedoresUseCase: GetProveedoresUseCase,
    private readonly getProveedorUseCase: GetProveedorUseCase,
    private readonly updateProveedorUseCase: UpdateProveedorUseCase,
    private readonly deleteProveedorUseCase: DeleteProveedorUseCase,
    private readonly getCuentaCorrienteProveedorUseCase: GetCuentaCorrienteProveedorUseCase,
    private readonly createOrdenCompraUseCase: CreateOrdenCompraUseCase,
    private readonly createFacturaProveedorUseCase: CreateFacturaProveedorUseCase,
    private readonly registrarPagoProveedorUseCase: RegistrarPagoProveedorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente', type: ProveedorResponseDto })
  async create(@Body() createProveedorDto: CreateProveedorDto): Promise<ProveedorResponseDto> {
    const proveedor = await this.createProveedorUseCase.execute(createProveedorDto);
    return ProveedorMapper.toResponseDto(proveedor);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores', type: [ProveedorResponseDto] })
  async findAll(@Query('activo') activo?: string): Promise<ProveedorResponseDto[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    const proveedores = await this.getProveedoresUseCase.execute(activoBool);
    return proveedores.map((p) => ProveedorMapper.toResponseDto(p));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado', type: ProveedorResponseDto })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async findOne(@Param('id') id: string): Promise<ProveedorResponseDto> {
    const proveedor = await this.getProveedorUseCase.execute(id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }
    return ProveedorMapper.toResponseDto(proveedor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado exitosamente', type: ProveedorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ): Promise<ProveedorResponseDto> {
    const proveedor = await this.updateProveedorUseCase.execute(id, updateProveedorDto);
    return ProveedorMapper.toResponseDto(proveedor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un proveedor (soft delete)' })
  @ApiResponse({ status: 204, description: 'Proveedor eliminado exitosamente' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteProveedorUseCase.execute(id);
  }

  @Get(':id/cuenta-corriente')
  @ApiOperation({ summary: 'Obtener cuenta corriente de un proveedor' })
  @ApiResponse({ status: 200, description: 'Cuenta corriente del proveedor', type: CuentaCorrienteProveedorDto })
  async getCuentaCorriente(@Param('id') id: string): Promise<CuentaCorrienteProveedorDto> {
    return this.getCuentaCorrienteProveedorUseCase.execute(id);
  }

  @Post(':id/ordenes-compra')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una orden de compra para un proveedor' })
  @ApiResponse({ status: 201, description: 'Orden de compra creada exitosamente' })
  async createOrdenCompra(
    @Param('id') proveedorId: string,
    @Body() createOrdenCompraDto: CreateOrdenCompraDto,
  ): Promise<any> {
    const orden = await this.createOrdenCompraUseCase.execute({
      ...createOrdenCompraDto,
      proveedorId,
    });
    return {
      id: orden.id,
      numero: orden.numero,
      proveedorId: orden.proveedorId,
      fecha: orden.fecha,
      fechaEstimadaEntrega: orden.fechaEstimadaEntrega,
      total: orden.calcularTotal(),
      estado: orden.estado,
      cantidadItems: orden.detalles.length,
    };
  }

  @Post('facturas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una factura de proveedor' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  async createFactura(@Body() createFacturaDto: CreateFacturaProveedorDto): Promise<any> {
    const factura = await this.createFacturaProveedorUseCase.execute(createFacturaDto);
    return {
      id: factura.id,
      numero: factura.numero,
      proveedorId: factura.proveedorId,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      total: factura.calcularTotal(),
      saldoPendiente: factura.calcularSaldoPendiente(),
      pagada: factura.pagada,
    };
  }

  @Post('facturas/:id/pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar un pago de factura de proveedor' })
  @ApiResponse({ status: 200, description: 'Pago registrado exitosamente' })
  async registrarPago(
    @Param('id') facturaId: string,
    @Body() registrarPagoDto: RegistrarPagoProveedorDto,
  ): Promise<{ message: string }> {
    await this.registrarPagoProveedorUseCase.execute({
      ...registrarPagoDto,
      facturaId,
    });
    return { message: 'Pago registrado exitosamente' };
  }
}

