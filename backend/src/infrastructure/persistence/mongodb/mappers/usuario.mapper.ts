import { Usuario } from '../../../../domain/entities/usuario.entity';
import { UsuarioMongo } from '../schemas/usuario.schema';
import { Rol } from '../../../../domain/enums/rol.enum';
import { Types } from 'mongoose';

export class UsuarioMapper {
  static toDomain(usuarioDoc: any): Usuario {
    if (!usuarioDoc) return null;

    return new Usuario(
      usuarioDoc._id.toString(),
      usuarioDoc.nombre,
      usuarioDoc.email,
      usuarioDoc.passwordHash,
      usuarioDoc.rol as Rol,
      usuarioDoc.activo,
      usuarioDoc.createdAt,
      usuarioDoc.updatedAt,
    );
  }

  static toPersistence(usuario: Usuario): any {
    const doc: any = {
      nombre: usuario.nombre,
      email: usuario.email,
      passwordHash: usuario.passwordHash,
      rol: usuario.rol,
      activo: usuario.activo,
    };

    if (usuario.id) {
      (doc as any)._id = new Types.ObjectId(usuario.id);
    }

    return doc;
  }
}

