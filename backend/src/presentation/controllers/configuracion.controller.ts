import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetRecargosConfigUseCase } from '../../application/use-cases/configuracion/get-recargos-config.use-case';
import { UpdateRecargosConfigUseCase } from '../../application/use-cases/configuracion/update-recargos-config.use-case';
import { RecargosConfigResponseDto, UpdateRecargosConfigDto } from '../../application/dtos/configuracion/recargos.dto';

@ApiTags('Configuración')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(
    private readonly getRecargosConfigUseCase: GetRecargosConfigUseCase,
    private readonly updateRecargosConfigUseCase: UpdateRecargosConfigUseCase,
  ) {}

  @Get('recargos')
  @ApiOperation({ summary: 'Obtener configuración de recargos (débito/crédito)' })
  getRecargos(): Promise<RecargosConfigResponseDto> {
    return this.getRecargosConfigUseCase.execute();
  }

  @Put('recargos')
  @ApiOperation({ summary: 'Actualizar configuración de recargos (débito/crédito)' })
  updateRecargos(
    @Body() dto: UpdateRecargosConfigDto,
    @Query('usuarioId') usuarioId?: string,
  ): Promise<RecargosConfigResponseDto> {
    return this.updateRecargosConfigUseCase.execute(dto, usuarioId);
  }
}



