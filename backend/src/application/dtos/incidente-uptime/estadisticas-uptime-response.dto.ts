import { ApiProperty } from '@nestjs/swagger';

export class EstadisticasUptimeResponseDto {
  @ApiProperty()
  totalIncidentes: number;

  @ApiProperty()
  incidentesAbiertos: number;

  @ApiProperty()
  incidentesCerrados: number;

  @ApiProperty({ description: 'Tiempo total fuera en segundos' })
  tiempoTotalFuera: number;

  @ApiProperty({ description: 'Tiempo promedio fuera en segundos' })
  tiempoPromedioFuera: number;

  @ApiProperty({ description: 'Porcentaje de uptime' })
  uptimePercentage: number;
}

