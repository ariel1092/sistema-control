import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateProductoUseCase } from '../../application/use-cases/productos/create-producto.use-case';
import { SearchProductoUseCase } from '../../application/use-cases/productos/search-producto.use-case';
import { CreateProductoDto } from '../../application/dtos/productos/create-producto.dto';
// TODO: Importar guards cuando estén implementados
// import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
// import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';

@ApiTags('Productos')
@Controller('productos')
// @UseGuards(JwtAuthGuard) // TODO: Activar cuando auth esté implementado
// @ApiBearerAuth()
export class ProductosController {
  constructor(
    private readonly createProductoUseCase: CreateProductoUseCase,
    private readonly searchProductoUseCase: SearchProductoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Producto con código duplicado' })
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN', 'SUPERVISOR')
  async create(@Body() createProductoDto: CreateProductoDto) {
    const producto = await this.createProductoUseCase.execute(createProductoDto);
    
    if (!producto.id) {
      throw new Error('El producto creado no tiene un ID válido');
    }
    
    return {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      unidadMedida: producto.unidadMedida,
      activo: producto.activo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      precioCosto: producto.precioCosto,
      createdAt: producto.createdAt,
      updatedAt: producto.updatedAt,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar productos por término' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos encontrados',
  })
  async search(@Query('q') termino: string) {
    const productos = await this.searchProductoUseCase.execute(termino);

    return productos
      .filter((p) => p.id) // Filtrar productos sin ID
      .map((p) => ({
        id: p.id!,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        precioVenta: p.precioVenta,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo,
        unidadMedida: p.unidadMedida,
        activo: p.activo,
        descripcion: p.descripcion,
        marca: p.marca,
        precioCosto: p.precioCosto,
      }));
  }

  @Get('codigo/:codigo')
  @ApiOperation({ summary: 'Buscar producto por código' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getByCodigo(@Param('codigo') codigo: string) {
    // TODO: Implementar caso de uso GetProductoByCodigoUseCase
    throw new Error('Not implemented yet');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getById(@Param('id') id: string) {
    // TODO: Implementar caso de uso GetProductoByIdUseCase
    throw new Error('Not implemented yet');
  }

  @Patch(':id/precio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar precio de un producto' })
  @ApiResponse({
    status: 200,
    description: 'Precio actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN', 'SUPERVISOR')
  async updatePrecio(
    @Param('id') id: string,
    @Body('precioVenta') precioVenta: number,
  ) {
    // TODO: Implementar caso de uso UpdatePrecioProductoUseCase
    throw new Error('Not implemented yet');
  }

  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar stock de un producto' })
  @ApiResponse({
    status: 200,
    description: 'Stock actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN', 'SUPERVISOR')
  async updateStock(
    @Param('id') id: string,
    @Body('stockActual') stockActual: number,
  ) {
    // TODO: Implementar caso de uso UpdateStockProductoUseCase
    throw new Error('Not implemented yet');
  }

  @Patch(':id/toggle-activo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar/Desactivar producto' })
  @ApiResponse({
    status: 200,
    description: 'Estado del producto actualizado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN')
  async toggleActivo(
    @Param('id') id: string,
    @Body('activo') activo: boolean,
  ) {
    // TODO: Implementar caso de uso ToggleActivoProductoUseCase
    throw new Error('Not implemented yet');
  }
}

