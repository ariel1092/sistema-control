import { Injectable, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { RegistrarAuditoriaUseCase } from '../auditoria/registrar-auditoria.use-case';
import { RegistrarMovimientoVentaUseCase } from './registrar-movimiento-venta.use-case';
import { RegistrarMovimientoCCVentaUseCase } from './registrar-movimiento-cc-venta.use-case';
import { RegistrarVentaStockUseCase } from '../productos/registrar-venta-stock.use-case';
import { TipoEventoVenta } from '../../../domain/enums/tipo-evento-venta.enum';
import { TipoEventoAuditoria } from '../../../domain/enums/tipo-evento-auditoria.enum';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';

@Injectable()
export class CancelarVentaUseCase {
    constructor(
        @Inject('IVentaRepository')
        private readonly ventaRepository: IVentaRepository,
        @Inject('IProductoRepository')
        private readonly productoRepository: IProductoRepository,
        private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
        private readonly registrarMovimientoVentaUseCase: RegistrarMovimientoVentaUseCase,
        private readonly registrarMovimientoCCVentaUseCase: RegistrarMovimientoCCVentaUseCase,
        private readonly registrarVentaStockUseCase: RegistrarVentaStockUseCase,
        @InjectConnection() private readonly connection: Connection,
    ) { }

    async execute(params: {
        ventaId: string;
        usuarioId: string;
        razon: string;
        ip?: string;
        userAgent?: string;
    }): Promise<void> {
        const session = await this.connection.startSession();

        try {
            await session.withTransaction(async () => {
                // 1. Buscar venta
                const venta = await this.ventaRepository.findById(params.ventaId);
                if (!venta) {
                    throw new VentaApplicationException('Venta no encontrada', 404);
                }

                // 2. Validar que no esté ya cancelada
                if (venta.estado === EstadoVenta.CANCELADA) {
                    throw new VentaApplicationException('La venta ya está cancelada', 400);
                }

                // 3. Crear snapshot ANTES de cancelar (auditoría)
                await this.registrarAuditoriaUseCase.execute({
                    entidad: 'venta',
                    entidadId: venta.id!,
                    evento: TipoEventoAuditoria.CANCELACION,
                    snapshot: {
                        ...venta,
                        estadoAnterior: venta.estado,
                    },
                    usuarioId: params.usuarioId,
                    ip: params.ip,
                    userAgent: params.userAgent,
                    razon: params.razon,
                }, { session });

                // 4. Registrar movimiento de cancelación
                await this.registrarMovimientoVentaUseCase.execute({
                    venta,
                    tipoEvento: TipoEventoVenta.CANCELACION,
                    usuarioId: params.usuarioId,
                    observaciones: params.razon,
                }, { session });

                // 5. Revertir stock (devolver productos y registrar movimientos)
                // Usamos Loop en paralalelo para eficiencia ya que son operaciones independientes
                await Promise.all(venta.detalles.map(async (detalle) => {
                    if (detalle.productoId) {
                        try {
                            await this.registrarVentaStockUseCase.revertirVenta(
                                detalle.productoId,
                                detalle.cantidad,
                                venta.id!,
                                params.usuarioId,
                                { session }
                            );
                        } catch (error) {
                            // Loguear pero no interrumpir si un producto fallara (aunque con transacciones fallará todo)
                            // En contexto transaccional, cualquier throw aquí abortará todo, lo cual es correcto.
                            throw error;
                        }
                    }
                }));

                // 6. Marcar venta como cancelada
                venta.cancelar(params.usuarioId, params.razon);
                await this.ventaRepository.save(venta, { session });

                // 7. Revertir movimientos de cuenta corriente si existen
                if (venta.esCuentaCorriente) {
                    await this.registrarMovimientoCCVentaUseCase.revertirPorVenta({
                        venta,
                        usuarioId: params.usuarioId,
                    }, { session });
                }
            });
        } finally {
            await session.endSession();
        }
    }
}
