import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductosController } from '../../presentation/controllers/productos.controller';
import { ProductosPreciosProveedoresController } from '../../interfaces/http/controllers/productos/productos-precios-proveedores.controller';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { CreateProductoUseCase } from '../../application/use-cases/productos/create-producto.use-case';
import { SearchProductoUseCase } from '../../application/use-cases/productos/search-producto.use-case';
import { GetProductoByIdUseCase } from '../../application/use-cases/productos/get-producto-by-id.use-case';
import { UpdateProductoUseCase } from '../../application/use-cases/productos/update-producto.use-case';
import { DeleteProductoUseCase } from '../../application/use-cases/productos/delete-producto.use-case';
import { IngresarStockUseCase } from '../../application/use-cases/productos/ingresar-stock.use-case';
import { DescontarStockManualUseCase } from '../../application/use-cases/productos/descontar-stock-manual.use-case';
import { AjusteInventarioUseCase } from '../../application/use-cases/productos/ajuste-inventario.use-case';
import { RegistrarVentaStockUseCase } from '../../application/use-cases/productos/registrar-venta-stock.use-case';
import { GetMovimientosStockUseCase } from '../../application/use-cases/productos/get-movimientos-stock.use-case';
import { GetProductosAlertasUseCase } from '../../application/use-cases/productos/get-productos-alertas.use-case';
import { GetAllProductosUseCase } from '../../application/use-cases/productos/get-all-productos.use-case';
import { ImportarProductosExcelUseCase } from '../../application/use-cases/productos/importar-productos-excel.use-case';
import { ExcelParserService } from '../../application/use-cases/productos/import/excel-parser.service';
import { ParseProductosExcelUseCase } from '../../application/use-cases/productos/import/parse-productos-excel.use-case';
import { ProductoRepository } from '../../infrastructure/persistence/mongodb/repositories/producto.repository';
import { MovimientoStockRepository } from '../../infrastructure/persistence/mongodb/repositories/movimiento-stock.repository';
import { PrecioProveedorProductoRepository } from '../../infrastructure/persistence/mongodb/repositories/precio-proveedor-producto.repository';
import { ProductoMongo, ProductoSchema } from '../../infrastructure/persistence/mongodb/schemas/producto.schema';
import { MovimientoStockMongo, MovimientoStockSchema } from '../../infrastructure/persistence/mongodb/schemas/movimiento-stock.schema';
import { PrecioProveedorProductoMongo, PrecioProveedorProductoSchema } from '../../infrastructure/persistence/mongodb/schemas/precio-proveedor-producto.schema';
import { GetComparacionPreciosProveedorPorProductoUseCase } from '../../application/use-cases/precios/get-comparacion-precios-proveedor-por-producto.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductoMongo.name, schema: ProductoSchema },
      { name: MovimientoStockMongo.name, schema: MovimientoStockSchema },
      { name: PrecioProveedorProductoMongo.name, schema: PrecioProveedorProductoSchema },
    ]),
    AuthModule,
    forwardRef(() => ProveedoresModule),
  ],
  controllers: [ProductosController, ProductosPreciosProveedoresController],
  providers: [
    // Repositorios
    {
      provide: 'IProductoRepository',
      useClass: ProductoRepository,
    },
    {
      provide: 'IMovimientoStockRepository',
      useClass: MovimientoStockRepository,
    },
    {
      provide: 'IPrecioProveedorProductoRepository',
      useClass: PrecioProveedorProductoRepository,
    },
    // Casos de uso
    CreateProductoUseCase,
    SearchProductoUseCase,
    GetProductoByIdUseCase,
    UpdateProductoUseCase,
    DeleteProductoUseCase,
    IngresarStockUseCase,
    DescontarStockManualUseCase,
    AjusteInventarioUseCase,
    RegistrarVentaStockUseCase,
    GetMovimientosStockUseCase,
    GetProductosAlertasUseCase,
    GetAllProductosUseCase,
    ImportarProductosExcelUseCase,
    ExcelParserService,
    ParseProductosExcelUseCase,
    GetComparacionPreciosProveedorPorProductoUseCase,
  ],
  exports: [
    CreateProductoUseCase,
    SearchProductoUseCase,
    GetProductoByIdUseCase,
    UpdateProductoUseCase,
    DeleteProductoUseCase,
    IngresarStockUseCase,
    DescontarStockManualUseCase,
    AjusteInventarioUseCase,
    RegistrarVentaStockUseCase,
    GetMovimientosStockUseCase,
    GetProductosAlertasUseCase,
    GetAllProductosUseCase,
    ImportarProductosExcelUseCase,
    ExcelParserService,
    ParseProductosExcelUseCase,
    'IProductoRepository',
    'IMovimientoStockRepository',
    'IPrecioProveedorProductoRepository',
    GetComparacionPreciosProveedorPorProductoUseCase,
  ],
})
export class ProductosModule { }











