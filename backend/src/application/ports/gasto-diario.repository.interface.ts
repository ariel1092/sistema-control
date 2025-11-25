import { GastoDiario } from '../../domain/entities/gasto-diario.entity';

export interface IGastoDiarioRepository {
  save(gasto: GastoDiario): Promise<GastoDiario>;
  findById(id: string): Promise<GastoDiario | null>;
  findAll(fechaInicio?: Date, fechaFin?: Date, categoria?: string): Promise<GastoDiario[]>;
  delete(id: string): Promise<void>;
  getTotalPorCategoria(fechaInicio: Date, fechaFin: Date): Promise<Array<{ categoria: string; total: number }>>;
  getTotalPorPeriodo(fechaInicio: Date, fechaFin: Date): Promise<number>;
}


