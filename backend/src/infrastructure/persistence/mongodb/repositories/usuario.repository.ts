import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUsuarioRepository } from '../../../../application/ports/usuario.repository.interface';
import { Usuario } from '../../../../domain/entities/usuario.entity';
import { UsuarioMongo, UsuarioDocument } from '../schemas/usuario.schema';
import { UsuarioMapper } from '../mappers/usuario.mapper';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectModel(UsuarioMongo.name)
    private usuarioModel: Model<UsuarioDocument>,
  ) {}

  async save(usuario: Usuario): Promise<Usuario> {
    const usuarioDoc = UsuarioMapper.toPersistence(usuario);

    if (usuario.id) {
      const updated = await this.usuarioModel
        .findByIdAndUpdate(usuario.id, usuarioDoc, { new: true })
        .exec();
      return UsuarioMapper.toDomain(updated);
    } else {
      const created = await this.usuarioModel.create(usuarioDoc);
      return UsuarioMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<Usuario | null> {
    const usuarioDoc = await this.usuarioModel.findById(id).exec();
    return usuarioDoc ? UsuarioMapper.toDomain(usuarioDoc) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    console.log(`[UsuarioRepository] Buscando usuario con email: ${email}`);
    const usuarioDoc = await this.usuarioModel.findOne({ email }).exec();
    console.log(`[UsuarioRepository] Documento encontrado:`, usuarioDoc ? `Sí (${usuarioDoc.email})` : 'No');
    if (usuarioDoc) {
      console.log(`[UsuarioRepository] Datos del documento:`, {
        id: usuarioDoc._id,
        email: usuarioDoc.email,
        nombre: usuarioDoc.nombre,
        activo: usuarioDoc.activo,
        rol: usuarioDoc.rol,
      });
    }
    return usuarioDoc ? UsuarioMapper.toDomain(usuarioDoc) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const usuariosDocs = await this.usuarioModel.find().exec();
    return usuariosDocs.map((doc) => UsuarioMapper.toDomain(doc));
  }

  async update(usuario: Usuario): Promise<Usuario> {
    return this.save(usuario);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: marcar como inactivo
    await this.usuarioModel
      .findByIdAndUpdate(id, { activo: false })
      .exec();
  }
}






