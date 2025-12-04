import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint con verificación de MongoDB' })
  @ApiResponse({ status: 200, description: 'Servicio y base de datos funcionando correctamente' })
  @ApiResponse({ status: 500, description: 'Error en servicio o base de datos' })
  async health(@Res() res: Response) {
    try {
      // Verificar conexión a MongoDB
      const dbState = this.connection.readyState;
      const isConnected = dbState === 1; // 1 = connected

      if (!isConnected) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'error',
          service: 'ventas-ferreteria-backend',
          database: 'disconnected',
          databaseState: this.getStateName(dbState),
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      }

      // Hacer ping a la base de datos para verificar que responde
      await this.connection.db.admin().ping();

      return res.status(HttpStatus.OK).json({
        status: 'ok',
        service: 'ventas-ferreteria-backend',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        service: 'ventas-ferreteria-backend',
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }
  }

  private getStateName(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}

