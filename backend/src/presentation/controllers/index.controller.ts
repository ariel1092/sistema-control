import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Index')
@Controller()
export class IndexController {
  @Get()
  @ApiOperation({ summary: 'Endpoint raíz - Información del servicio' })
  root(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      service: 'ventas-ferreteria-backend',
      version: '1.0.0',
      status: 'ok',
      message: 'API de Gestión de Ventas para Ferretería',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/v1/docs',
        api: '/api/v1',
      },
      timestamp: new Date().toISOString(),
    });
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check simplificado (alias)' })
  health(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'ok',
      service: 'ventas-ferreteria-backend',
      timestamp: new Date().toISOString(),
      message: 'Para verificación completa, use /api/v1/health',
    });
  }
}

