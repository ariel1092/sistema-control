import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { AbrirCajaDto } from '../../dtos/caja/abrir-caja.dto';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja, OrigenMovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { toBusinessDayStartUtc } from '../../../utils/date.utils';

@Injectable()
export class AbrirCajaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(dto: AbrirCajaDto, usuarioId: string): Promise<CierreCaja> {
    const session = await this.connection.startSession();
    try {
      let result: CierreCaja | undefined;
      try {
        await session.withTransaction(async () => {
          const fechaHoy = new Date();
          // Normalizar fecha al inicio del "día de negocio" (calendario local)
          const fechaInicio = toBusinessDayStartUtc(fechaHoy);

          // Verificar si ya existe una caja abierta
          const cajaAbierta = await this.cajaRepository.findCajaAbierta(fechaInicio, { session });
          if (cajaAbierta) {
            throw new ConflictException('Ya existe una caja abierta para hoy');
          }

          // Crear nueva caja
          const caja = CierreCaja.crear({
            fecha: fechaInicio,
            usuarioId,
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalTransferencia: 0,
            cantidadVentas: 0,
            estado: 'ABIERTO',
          });

          const cajaGuardada = await this.cajaRepository.save(caja, { session });

          // Si hay monto inicial, registrarlo como asiento explícito
          if (dto.montoInicial > 0) {
            const mov = MovimientoCaja.crear({
              cierreCajaId: cajaGuardada.id!,
              tipo: TipoMovimientoCaja.INGRESO,
              monto: dto.montoInicial,
              motivo: 'Apertura de caja',
              usuarioId,
              origen: OrigenMovimientoCaja.MANUAL,
            });
            await this.movimientoCajaRepository.save(mov, { session });
            // P0: No persistir totales en cierre_cajas. El monto inicial vive solo como asiento.
            result = cajaGuardada;
            return;
          }

          result = cajaGuardada;
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

