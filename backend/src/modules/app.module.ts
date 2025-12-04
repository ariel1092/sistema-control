import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
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
import { HealthController } from '../presentation/controllers/health.controller';

@Module({
  imports: [
    DatabaseModule,
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
