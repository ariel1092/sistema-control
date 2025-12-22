import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { VentasModule } from './ventas/ventas.module';
import { ProductosModule } from './productos/productos.module';
import { CajaModule } from './caja/caja.module';
import { ClientesModule } from './clientes/clientes.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { GastosDiariosModule } from './gastos-diarios/gastos-diarios.module';
import { ReportesModule } from './reportes/reportes.module';
import { RetirosSociosModule } from './retiros-socios/retiros-socios.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { AuthModule } from './auth/auth.module';
import { MonitoreoModule } from './monitoreo/monitoreo.module';
import { NumeracionFiscalModule } from './numeracion-fiscal/numeracion-fiscal.module';
import { ComprobantesFiscalesModule } from './comprobantes-fiscales/comprobantes-fiscales.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { HealthController } from '../presentation/controllers/health.controller';
import { IndexController } from '../presentation/controllers/index.controller';

@Module({
  imports: [
    // Rate Limiting: 100 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos (1 minuto)
        limit: 100, // 100 requests máximo
      },
    ]),
    DatabaseModule,
    CacheModule,
    AuthModule,
    VentasModule,
    ProductosModule,
    CajaModule,
    ClientesModule,
    EmpleadosModule,
    GastosDiariosModule,
    ReportesModule,
    RetirosSociosModule,
    ProveedoresModule,
    MonitoreoModule,
    NumeracionFiscalModule,
    ComprobantesFiscalesModule,
    ConfiguracionModule,
  ],
  controllers: [IndexController, HealthController],
  providers: [
    // Aplicar ThrottlerGuard globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
