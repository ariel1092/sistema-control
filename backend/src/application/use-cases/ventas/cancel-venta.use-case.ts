import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';

@Injectable()
export class CancelVentaUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async execute(
    ventaId: string,
    usuarioId: string,
    motivo?: string,
  ): Promise<void> {
    // 1. Buscar la venta
    const venta = await this.ventaRepository.findById(ventaId);

    if (!venta) {
      throw new VentaApplicationException(
        `Venta con ID ${ventaId} no encontrada`,
        404,
        'VENTA_NO_ENCONTRADA',
      );
    }

    if (venta.estado === EstadoVenta.CANCELADA) {
      throw new VentaApplicationException(
        'La venta ya está cancelada',
        400,
        'VENTA_YA_CANCELADA',
      );
    }

    // 2. Validar que la venta sea reciente (ej: mismo día)
    const hoy = new Date();
    const fechaVenta = new Date(venta.fecha);

    if (fechaVenta.toDateString() !== hoy.toDateString()) {
      throw new VentaApplicationException(
        'Solo se pueden cancelar ventas del día actual',
        400,
        'VENTA_NO_CANCELABLE',
      );
    }

    // 3. Cancelar la venta
    venta.cancelar(usuarioId, motivo);

    // 4. Reponer stock de cada producto
    for (const detalle of venta.detalles) {
      const producto = await this.productoRepository.findById(
        detalle.productoId,
      );
      if (producto) {
        producto.reponer(detalle.cantidad);
        await this.productoRepository.update(producto);
      }
    }

    // 5. Guardar cambios
    await this.ventaRepository.update(venta);
  }
}

