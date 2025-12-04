import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository } from '../../ports/usuario.repository.interface';
import { RegisterDto } from '../../dtos/auth/register.dto';
import { AuthResponseDto } from '../../dtos/auth/auth-response.dto';
import { Usuario } from '../../../domain/entities/usuario.entity';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const usuarioExistente = await this.usuarioRepository.findByEmail(dto.email);

    if (usuarioExistente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = Usuario.crear({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      rol: dto.rol,
      activo: true,
    });

    const usuarioGuardado = await this.usuarioRepository.save(usuario);

    const payload = {
      sub: usuarioGuardado.id,
      email: usuarioGuardado.email,
      rol: usuarioGuardado.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: usuarioGuardado.id!,
        nombre: usuarioGuardado.nombre,
        email: usuarioGuardado.email,
        rol: usuarioGuardado.rol,
      },
    };
  }
}


