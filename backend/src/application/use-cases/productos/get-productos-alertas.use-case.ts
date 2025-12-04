import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';

@Injectable()
export class GetProductosAlertasUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async execute(): Promise<{ sinStock: Producto[]; stockBajo: Producto[] }> {
    const productos = await this.productoRepository.findAll(true); // Solo activos

    const sinStock = productos.filter((p) => p.stockActual === 0);
    const stockBajo = productos.filter(
      (p) => p.stockActual > 0 && p.estaPorDebajoDelMinimo(),
    );

    return { sinStock, stockBajo };
  }
}

