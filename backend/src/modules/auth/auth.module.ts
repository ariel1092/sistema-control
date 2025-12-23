import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { UsuarioRepository } from '../../infrastructure/persistence/mongodb/repositories/usuario.repository';
import { UsuarioMongo, UsuarioSchema } from '../../infrastructure/persistence/mongodb/schemas/usuario.schema';
import { PerfJwtGuard } from '../../infrastructure/auth/guards/perf-jwt.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsuarioMongo.name, schema: UsuarioSchema },
    ]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'IUsuarioRepository',
      useClass: UsuarioRepository,
    },
    LoginUseCase,
    RegisterUseCase,
    PerfJwtGuard,
  ],
  // Exportamos JwtModule y el guard para que otros módulos (Caja/Ventas/Productos) puedan usar PerfJwtGuard
  exports: [JwtModule, LoginUseCase, RegisterUseCase, 'IUsuarioRepository', PerfJwtGuard],
})
export class AuthModule {}

