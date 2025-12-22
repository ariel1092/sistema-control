import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { CrearMovimientoCajaDto } from '../../dtos/caja/movimiento-caja.dto';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { toBusinessDayStartUtc } from '../../../utils/date.utils';

@Injectable()
export class CrearMovimientoCajaUseCase {
  constructor(
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(dto: CrearMovimientoCajaDto, usuarioId: string): Promise<MovimientoCaja> {
    const session = await this.connection.startSession();
    try {
      let result: MovimientoCaja | undefined;
      try {
        await session.withTransaction(async () => {
          const fechaHoy = new Date();

          // Normalizar fecha al inicio del "día de negocio" (calendario local)
          const fechaInicio = toBusinessDayStartUtc(fechaHoy);

          // Verificar que existe una caja abierta
          const caja = await this.cajaRepository.findCajaAbierta(fechaInicio, { session });
          if (!caja) {
            throw new NotFoundException('No hay una caja abierta. Debe abrir la caja primero');
          }

          if (caja.estaCerrada()) {
            throw new BadRequestException('No se pueden realizar movimientos en una caja cerrada');
          }

          // Crear movimiento
          const movimiento = MovimientoCaja.crear({
            cierreCajaId: caja.id!,
            tipo: dto.tipo,
            monto: dto.monto,
            motivo: dto.motivo,
            usuarioId,
          });

          result = await this.movimientoCajaRepository.save(movimiento, { session });
        });
      } catch (error: any) {
        if (String(error?.message || '').includes('Transaction numbers are only allowed on a replica set member')) {
          throw new Error(
            'MongoDB debe estar configurado como Replica Set para usar transacciones. ' +
            'Configura un replica set (incluso single-node) y reinicia la aplicación.',
          );
        }
        throw error;
      }

      return result!;
    } finally {
      await session.endSession();
    }
  }
}

