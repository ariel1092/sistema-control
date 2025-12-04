import { FacturaProveedor } from '../../domain/entities/factura-proveedor.entity';

export interface IFacturaProveedorRepository {
  save(factura: FacturaProveedor): Promise<FacturaProveedor>;
  findById(id: string): Promise<FacturaProveedor | null>;
  findByProveedor(proveedorId: string): Promise<FacturaProveedor[]>;
  findPendientes(proveedorId?: string): Promise<FacturaProveedor[]>;
  findPorVencer(dias: number, proveedorId?: string): Promise<FacturaProveedor[]>;
  findVencidas(proveedorId?: string): Promise<FacturaProveedor[]>;
  findAll(): Promise<FacturaProveedor[]>;
}





