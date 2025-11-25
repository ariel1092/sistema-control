import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { VentasModule } from './ventas/ventas.module';
import { ProductosModule } from './productos/productos.module';
import { CajaModule } from './caja/caja.module';
import { ClientesModule } from './clientes/clientes.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { GastosDiariosModule } from './gastos-diarios/gastos-diarios.module';
import { RetirosSociosModule } from './retiros-socios/retiros-socios.module';
import { ReportesModule } from './reportes/reportes.module';
import { ProveedoresModule } from './proveedores/proveedores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    VentasModule,
    ProductosModule,
    CajaModule,
    ClientesModule,
    EmpleadosModule,
    GastosDiariosModule,
    RetirosSociosModule,
    ReportesModule,
    ProveedoresModule,
  ],
})
export class AppModule {}


