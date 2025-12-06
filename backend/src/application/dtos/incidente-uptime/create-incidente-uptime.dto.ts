import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateIncidenteUptimeDto {
  @ApiProperty({ example: '2025-12-04T23:00:32.000Z' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ required: false, example: '2025-12-04T23:05:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiProperty({ example: '503 Service Unavailable' })
  @IsString()
  reason: string;

  @ApiProperty({ required: false, example: '4m 28s' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false, example: 268 })
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiProperty({ example: 'https://sistema-control.onrender.com/api/v1/health' })
  @IsString()
  monitorUrl: string;

  @ApiProperty({ example: 'sistema-control.onrender.com/api/v1/health' })
  @IsString()
  monitorName: string;
}

