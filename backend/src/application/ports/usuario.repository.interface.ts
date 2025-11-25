import { Usuario } from '../../domain/entities/usuario.entity';

export interface IUsuarioRepository {
  save(usuario: Usuario): Promise<Usuario>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  update(usuario: Usuario): Promise<Usuario>;
  delete(id: string): Promise<void>;
}





