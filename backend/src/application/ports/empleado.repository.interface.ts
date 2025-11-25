import { Empleado } from '../../domain/entities/empleado.entity';

export interface IEmpleadoRepository {
  save(empleado: Empleado): Promise<Empleado>;
  findById(id: string): Promise<Empleado | null>;
  findByDni(dni: string): Promise<Empleado | null>;
  findAll(activos?: boolean): Promise<Empleado[]>;
  delete(id: string): Promise<void>;
}


