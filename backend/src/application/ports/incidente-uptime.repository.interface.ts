import { IncidenteUptime } from '../../domain/entities/incidente-uptime.entity';
import { EstadoIncidente } from '../../domain/entities/incidente-uptime.entity';

export interface IIncidenteUptimeRepository {
  save(incidente: IncidenteUptime): Promise<IncidenteUptime>;
  findById(id: string): Promise<IncidenteUptime | null>;
  findAll(fechaInicio?: Date, fechaFin?: Date, monitorName?: string): Promise<IncidenteUptime[]>;
  findAbiertos(): Promise<IncidenteUptime[]>;
  findCerrados(fechaInicio?: Date, fechaFin?: Date): Promise<IncidenteUptime[]>;
  findByMonitorName(monitorName: string, fechaInicio?: Date, fechaFin?: Date): Promise<IncidenteUptime[]>;
  update(incidente: IncidenteUptime): Promise<IncidenteUptime>;
  delete(id: string): Promise<void>;
  getEstadisticas(fechaInicio: Date, fechaFin: Date): Promise<{
    totalIncidentes: number;
    incidentesAbiertos: number;
    incidentesCerrados: number;
    tiempoTotalFuera: number; // en segundos
    tiempoPromedioFuera: number; // en segundos
    uptimePercentage: number; // porcentaje
  }>;
}

