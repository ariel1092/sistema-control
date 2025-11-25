import { RetiroSocio } from '../../domain/entities/retiro-socio.entity';
import { CuentaBancaria } from '../../domain/enums/cuenta-bancaria.enum';

export interface IRetiroSocioRepository {
  save(retiro: RetiroSocio): Promise<RetiroSocio>;
  findById(id: string): Promise<RetiroSocio | null>;
  findAll(cuentaBancaria?: CuentaBancaria, fechaInicio?: Date, fechaFin?: Date): Promise<RetiroSocio[]>;
  delete(id: string): Promise<void>;
  getTotalRetiros(cuentaBancaria: CuentaBancaria, fechaInicio: Date, fechaFin: Date): Promise<number>;
}


