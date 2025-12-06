import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
import { HealthController } from '../presentation/controllers/health.controller';
import { IndexController } from '../presentation/controllers/index.controller';

@Module({
  imports: [
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
  ],
  controllers: [IndexController, HealthController],
})
export class AppModule {}
