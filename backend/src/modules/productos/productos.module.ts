import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductosController } from '../../presentation/controllers/productos.controller';
import { CreateProductoUseCase } from '../../application/use-cases/productos/create-producto.use-case';
import { SearchProductoUseCase } from '../../application/use-cases/productos/search-producto.use-case';
import { ProductoRepository } from '../../infrastructure/persistence/mongodb/repositories/producto.repository';
import { ProductoMongo, ProductoSchema } from '../../infrastructure/persistence/mongodb/schemas/producto.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductoMongo.name, schema: ProductoSchema },
    ]),
  ],
  controllers: [ProductosController],
  providers: [
    // Repositorio
    {
      provide: 'IProductoRepository',
      useClass: ProductoRepository,
    },
    // Casos de uso
    CreateProductoUseCase,
    SearchProductoUseCase,
  ],
  exports: [
    CreateProductoUseCase,
    SearchProductoUseCase,
    'IProductoRepository',
  ],
})
export class ProductosModule {}





