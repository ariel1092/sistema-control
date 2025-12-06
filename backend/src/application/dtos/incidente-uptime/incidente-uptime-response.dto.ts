import { ApiProperty } from '@nestjs/swagger';

export class IncidenteUptimeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  startDateTime: Date;

  @ApiProperty({ nullable: true })
  endDateTime: Date | null;

  @ApiProperty()
  reason: string;

  @ApiProperty({ nullable: true })
  duration: string | null;

  @ApiProperty({ nullable: true })
  durationSeconds: number | null;

  @ApiProperty()
  monitorUrl: string;

  @ApiProperty()
  monitorName: string;

  @ApiProperty({ enum: ['ABIERTO', 'CERRADO'] })
  estado: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

