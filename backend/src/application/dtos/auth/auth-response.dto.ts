import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../../../domain/enums/rol.enum';

export class AuthResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: Rol;
  };
}


