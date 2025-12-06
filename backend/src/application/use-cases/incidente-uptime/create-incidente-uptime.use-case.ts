import { Injectable, Inject } from '@nestjs/common';
import { IIncidenteUptimeRepository } from '../../ports/incidente-uptime.repository.interface';
import { IncidenteUptime } from '../../../domain/entities/incidente-uptime.entity';
import { CreateIncidenteUptimeDto } from '../../dtos/incidente-uptime/create-incidente-uptime.dto';
import { IncidenteUptimeResponseDto } from '../../dtos/incidente-uptime/incidente-uptime-response.dto';

@Injectable()
export class CreateIncidenteUptimeUseCase {
  constructor(
    @Inject('IIncidenteUptimeRepository')
    private readonly incidenteRepository: IIncidenteUptimeRepository,
  ) {}

  async execute(dto: CreateIncidenteUptimeDto): Promise<IncidenteUptimeResponseDto> {
    const incidente = IncidenteUptime.crear({
      startDateTime: new Date(dto.startDateTime),
      endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : null,
      reason: dto.reason,
      duration: dto.duration || null,
      durationSeconds: dto.durationSeconds || null,
      monitorUrl: dto.monitorUrl,
      monitorName: dto.monitorName,
    });

    const incidenteGuardado = await this.incidenteRepository.save(incidente);

    return this.mapToResponse(incidenteGuardado);
  }

  private mapToResponse(incidente: IncidenteUptime): IncidenteUptimeResponseDto {
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

