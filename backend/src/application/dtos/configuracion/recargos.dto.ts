import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class RecargosConfigResponseDto {
  @ApiProperty({ example: 0 })
  recargoDebitoPct: number;

  @ApiProperty({ example: 10 })
  recargoCreditoPct: number;
}

export class UpdateRecargosConfigDto {
  @ApiProperty({ description: 'Recargo % para débito', example: 5, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  recargoDebitoPct: number;

  @ApiProperty({ description: 'Recargo % para crédito', example: 10, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  recargoCreditoPct: number;
}




