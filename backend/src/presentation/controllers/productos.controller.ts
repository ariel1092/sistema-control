import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImportarProductosExcelUseCase } from '../../application/use-cases/productos/importar-productos-excel.use-case';
import { CreateProductoUseCase } from '../../application/use-cases/productos/create-producto.use-case';
import { SearchProductoUseCase } from '../../application/use-cases/productos/search-producto.use-case';
import { GetProductoByIdUseCase } from '../../application/use-cases/productos/get-producto-by-id.use-case';
import { UpdateProductoUseCase } from '../../application/use-cases/productos/update-producto.use-case';
import { DeleteProductoUseCase } from '../../application/use-cases/productos/delete-producto.use-case';
import { IngresarStockUseCase } from '../../application/use-cases/productos/ingresar-stock.use-case';
import { DescontarStockManualUseCase } from '../../application/use-cases/productos/descontar-stock-manual.use-case';
import { AjusteInventarioUseCase } from '../../application/use-cases/productos/ajuste-inventario.use-case';
import { GetMovimientosStockUseCase } from '../../application/use-cases/productos/get-movimientos-stock.use-case';
import { GetProductosAlertasUseCase } from '../../application/use-cases/productos/get-productos-alertas.use-case';
import { GetAllProductosUseCase } from '../../application/use-cases/productos/get-all-productos.use-case';
import { IngresarStockDto, DescontarStockDto, AjusteInventarioDto } from '../../application/dtos/productos/movimiento-stock.dto';
import { CreateProductoDto } from '../../application/dtos/productos/create-producto.dto';
import { TipoMovimientoStock } from '../../domain/enums/tipo-movimiento-stock.enum';
// import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard'; // Descomentar cuando tengas auth

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(
    private readonly createProductoUseCase: CreateProductoUseCase,
    private readonly searchProductoUseCase: SearchProductoUseCase,
    private readonly getProductoByIdUseCase: GetProductoByIdUseCase,
    private readonly updateProductoUseCase: UpdateProductoUseCase,
    private readonly deleteProductoUseCase: DeleteProductoUseCase,
    private readonly ingresarStockUseCase: IngresarStockUseCase,
    private readonly descontarStockManualUseCase: DescontarStockManualUseCase,
    private readonly ajusteInventarioUseCase: AjusteInventarioUseCase,
    private readonly getMovimientosStockUseCase: GetMovimientosStockUseCase,
    private readonly getProductosAlertasUseCase: GetProductosAlertasUseCase,
    private readonly getAllProductosUseCase: GetAllProductosUseCase,
    private readonly importarProductosExcelUseCase: ImportarProductosExcelUseCase,
  ) { }

  @Post('importar-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar productos desde Excel' })
  @ApiResponse({ status: 200, description: 'Importación completada' })
  async importExcel(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No se ha subido ningún archivo');
    }
    console.log('Procesando archivo excel...');
    return this.importarProductosExcelUseCase.execute(file.buffer);
  }


  @Get()
  @ApiOperation({ summary: 'Buscar o listar productos' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async search(
    @Query('q') termino?: string,
    @Query('all') all?: string,
    @Query('activos') activos?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const pageNum = page ? parseInt(page) : 1;
    const skip = (pageNum - 1) * limitNum;

    if (all === 'true') {
      const soloActivos = activos !== undefined ? activos === 'true' : true;
      return this.getAllProductosUseCase.execute(soloActivos, limitNum, skip);
    }
    if (termino) {
      return this.searchProductoUseCase.execute(termino, limitNum, skip);
    }
    const soloActivos = activos !== undefined ? activos === 'true' : undefined;
    return this.getAllProductosUseCase.execute(soloActivos, limitNum, skip);
  }

  @Get('alertas')
  @ApiOperation({ summary: 'Obtener productos con alertas de stock' })
  @ApiResponse({ status: 200, description: 'Productos sin stock y con stock bajo' })
  getAlertas() {
    return this.getProductosAlertasUseCase.execute();
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Obtener movimientos de stock' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos de stock' })
  getMovimientos(
    @Query('productoId') productoId?: string,
    @Query('tipo') tipo?: TipoMovimientoStock,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    return this.getMovimientosStockUseCase.execute(productoId, tipo, fechaInicioDate, fechaFinDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.getProductoByIdUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  create(@Body() dto: CreateProductoDto) {
    return this.createProductoUseCase.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.updateProductoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar producto con movimientos' })
  async remove(@Param('id') id: string) {
    await this.deleteProductoUseCase.execute(id);
    return { message: 'Producto eliminado exitosamente' };
  }

  @Post(':id/stock/ingresar')
  @ApiOperation({ summary: 'Ingresar stock a un producto' })
  @ApiResponse({ status: 200, description: 'Stock ingresado exitosamente' })
  // @UseGuards(JwtAuthGuard) // Descomentar cuando tengas auth
  async ingresarStock(
    @Param('id') id: string,
    @Body() dto: IngresarStockDto,
    @Request() req: any, // Cambiar a tipo correcto cuando tengas auth
  ) {
    const userId = req.user?.userId || 'system'; // Temporal hasta tener auth
    return this.ingresarStockUseCase.execute(id, dto.cantidad, dto.descripcion, userId);
  }

  @Post(':id/stock/descontar')
  @ApiOperation({ summary: 'Descontar stock manualmente de un producto' })
  @ApiResponse({ status: 200, description: 'Stock descontado exitosamente' })
  // @UseGuards(JwtAuthGuard)
  async descontarStock(
    @Param('id') id: string,
    @Body() dto: DescontarStockDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'system';
    return this.descontarStockManualUseCase.execute(id, dto.cantidad, dto.motivo, userId);
  }

  @Post(':id/stock/ajustar')
  @ApiOperation({ summary: 'Ajustar inventario de un producto' })
  @ApiResponse({ status: 200, description: 'Inventario ajustado exitosamente' })
  // @UseGuards(JwtAuthGuard)
  async ajustarInventario(
    @Param('id') id: string,
    @Body() dto: AjusteInventarioDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'system';
    return this.ajusteInventarioUseCase.execute(id, dto.cantidad, dto.motivo, userId);
  }
}

