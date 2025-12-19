import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { LoginDto } from '../../application/dtos/auth/login.dto';
import { RegisterDto } from '../../application/dtos/auth/register.dto';
import { AuthResponseDto } from '../../application/dtos/auth/auth-response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) { }

  @Post('login')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 intentos por minuto
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de login' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(loginDto);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros por minuto
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de registro' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(registerDto);
  }
}




