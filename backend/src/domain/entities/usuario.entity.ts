import { Rol } from '../enums/rol.enum';

export class Usuario {
  constructor(
    public readonly id: string | undefined,
    public readonly nombre: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly rol: Rol,
    public activo: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim() === '') {
      throw new Error('El nombre es obligatorio');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('El email no es válido');
    }

    if (!this.passwordHash || this.passwordHash.trim() === '') {
      throw new Error('El hash de contraseña es obligatorio');
    }

    if (!Object.values(Rol).includes(this.rol)) {
      throw new Error('El rol no es válido');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public marcarActivo(activo: boolean): void {
    this.activo = activo;
  }

  public tieneRol(rol: Rol): boolean {
    return this.rol === rol;
  }

  public puedeCancelarVenta(): boolean {
    return this.rol === Rol.ADMIN || this.rol === Rol.SUPERVISOR;
  }

  static crear(params: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Rol;
    activo?: boolean;
  }): Usuario {
    return new Usuario(
      undefined,
      params.nombre,
      params.email,
      params.passwordHash,
      params.rol,
      params.activo !== undefined ? params.activo : true,
    );
  }
}











