import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { Venta } from '../../../domain/entities/venta.entity';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

@Injectable()
export class GetTransferenciasSocioUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
  ) {}

  async execute(cuentaBancaria: CuentaBancaria, fechaInicio?: Date, fechaFin?: Date): Promise<Venta[]> {
    const fechaInicioDate = fechaInicio || new Date();
    fechaInicioDate.setHours(0, 0, 0, 0);
    
    const fechaFinDate = fechaFin || new Date(fechaInicioDate);
    fechaFinDate.setHours(23, 59, 59, 999);

    const ventas = await this.ventaRepository.findByRangoFechas(
      fechaInicioDate,
      fechaFinDate,
    );

    // Filtrar solo ventas completadas con transferencias a la cuenta especificada
    const ventasFiltradas = ventas.filter((v) => {
      if (v.estado !== EstadoVenta.COMPLETADA) return false;
      
      return v.metodosPago.some(
        (mp) =>
          mp.tipo === TipoMetodoPago.TRANSFERENCIA &&
          mp.cuentaBancaria === cuentaBancaria,
      );
    });

    // Ordenar por fecha más reciente primero
    return ventasFiltradas.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}









