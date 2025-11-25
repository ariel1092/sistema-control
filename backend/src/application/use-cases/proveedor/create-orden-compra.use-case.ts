import { Inject, Injectable } from '@nestjs/common';
import { IOrdenCompraRepository } from '../../ports/orden-compra.repository.interface';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { OrdenCompra } from '../../../domain/entities/orden-compra.entity';
import { DetalleOrdenCompra } from '../../../domain/entities/detalle-orden-compra.entity';
import { EstadoOrdenCompra } from '../../../domain/enums/estado-orden-compra.enum';

export interface CreateOrdenCompraDto {
  proveedorId: string;
  fecha: string;
  fechaEstimadaEntrega?: string;
  detalles: Array<{
    productoId: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    observaciones?: string;
  }>;
  observaciones?: string;
}

@Injectable()
export class CreateOrdenCompraUseCase {
  constructor(
    @Inject('IOrdenCompraRepository')
    private readonly ordenCompraRepository: IOrdenCompraRepository,
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async execute(dto: CreateOrdenCompraDto): Promise<OrdenCompra> {
    // Validar proveedor
    const proveedor = await this.proveedorRepository.findById(dto.proveedorId);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    // Generar número de orden
    const ultimaOrden = await this.ordenCompraRepository.findAll();
    const numeroOrden = `OC-${String(ultimaOrden.length + 1).padStart(6, '0')}`;

    // Crear detalles
    const detalles = dto.detalles.map((det) =>
      DetalleOrdenCompra.crear({
        productoId: det.productoId,
        codigoProducto: det.codigoProducto,
        nombreProducto: det.nombreProducto,
        cantidad: det.cantidad,
        precioUnitario: det.precioUnitario,
        observaciones: det.observaciones,
      }),
    );

    // Crear orden de compra
    const orden = OrdenCompra.crear({
      numero: numeroOrden,
      proveedorId: dto.proveedorId,
      fecha: new Date(dto.fecha),
      fechaEstimadaEntrega: dto.fechaEstimadaEntrega ? new Date(dto.fechaEstimadaEntrega) : undefined,
      detalles,
      observaciones: dto.observaciones,
    });

    return await this.ordenCompraRepository.save(orden);
  }
}


