import { Injectable, Inject } from '@nestjs/common';
import { IIncidenteUptimeRepository } from '../../ports/incidente-uptime.repository.interface';
import { IncidenteUptimeResponseDto } from '../../dtos/incidente-uptime/incidente-uptime-response.dto';

@Injectable()
export class GetAllIncidentesUseCase {
  constructor(
    @Inject('IIncidenteUptimeRepository')
    private readonly incidenteRepository: IIncidenteUptimeRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date, monitorName?: string): Promise<IncidenteUptimeResponseDto[]> {
    const incidentes = await this.incidenteRepository.findAll(fechaInicio, fechaFin, monitorName);
    return incidentes.map(this.mapToResponse);
  }

  private mapToResponse(incidente: any): IncidenteUptimeResponseDto {
    return {
      id: incidente.id!,
      startDateTime: incidente.startDateTime,
      endDateTime: incidente.endDateTime,
      reason: incidente.reason,
      duration: incidente.duration,
      durationSeconds: incidente.durationSeconds,
      monitorUrl: incidente.monitorUrl,
      monitorName: incidente.monitorName,
      estado: incidente.estado,
      createdAt: incidente.createdAt,
      updatedAt: incidente.updatedAt,
    };
  }
}

