import { Injectable, Inject } from '@nestjs/common';
import { IIncidenteUptimeRepository } from '../../ports/incidente-uptime.repository.interface';
import { EstadisticasUptimeResponseDto } from '../../dtos/incidente-uptime/estadisticas-uptime-response.dto';

@Injectable()
export class GetEstadisticasUptimeUseCase {
  constructor(
    @Inject('IIncidenteUptimeRepository')
    private readonly incidenteRepository: IIncidenteUptimeRepository,
  ) {}

  async execute(fechaInicio: Date, fechaFin: Date): Promise<EstadisticasUptimeResponseDto> {
    const estadisticas = await this.incidenteRepository.getEstadisticas(fechaInicio, fechaFin);
    return estadisticas;
  }
}

