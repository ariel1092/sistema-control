import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IFacturaProveedorRepository } from '../../../../application/ports/factura-proveedor.repository.interface';
import { FacturaProveedor } from '../../../../domain/entities/factura-proveedor.entity';
import { FacturaProveedorMongo, FacturaProveedorDocument } from '../schemas/factura-proveedor.schema';
import { DetalleFacturaProveedorMongo, DetalleFacturaProveedorDocument } from '../schemas/detalle-factura-proveedor.schema';
import { FacturaProveedorMapper } from '../mappers/factura-proveedor.mapper';

@Injectable()
export class FacturaProveedorRepository implements IFacturaProveedorRepository {
  constructor(
    @InjectModel(FacturaProveedorMongo.name)
    private facturaModel: Model<FacturaProveedorDocument>,
    @InjectModel(DetalleFacturaProveedorMongo.name)
    private detalleModel: Model<DetalleFacturaProveedorDocument>,
  ) {}

  async save(factura: FacturaProveedor): Promise<FacturaProveedor> {
    const { factura: facturaDoc, detalles: detallesDocs } = FacturaProveedorMapper.toPersistence(factura);

    let facturaGuardada;
    if (factura.id) {
      facturaGuardada = await this.facturaModel
        .findByIdAndUpdate(factura.id, facturaDoc, { new: true })
        .exec();

      await this.detalleModel.deleteMany({
        facturaId: new Types.ObjectId(factura.id),
      }).exec();
    } else {
      facturaGuardada = await this.facturaModel.create(facturaDoc);
    }

    const detallesGuardados = await this.detalleModel.insertMany(
      detallesDocs.map((det) => ({
        ...det,
        facturaId: facturaGuardada._id,
      })),
    );

    return FacturaProveedorMapper.toDomain(facturaGuardada, detallesGuardados as any[]);
  }

  async findById(id: string): Promise<FacturaProveedor | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const facturaDoc = await this.facturaModel.findById(id).exec();
    if (!facturaDoc) return null;

    const detallesDocs = await this.detalleModel
      .find({ facturaId: new Types.ObjectId(id) })
      .exec();

    return FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs);
  }

  async findByProveedor(proveedorId: string): Promise<FacturaProveedor[]> {
    const facturasDocs = await this.facturaModel
      .find({ proveedorId: new Types.ObjectId(proveedorId) })
      .sort({ fecha: -1 })
      .exec();

    const facturas: FacturaProveedor[] = [];
    for (const facturaDoc of facturasDocs) {
      const detallesDocs = await this.detalleModel
        .find({ facturaId: facturaDoc._id })
        .exec();
      facturas.push(FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs));
    }

    return facturas;
  }

  async findPendientes(proveedorId?: string): Promise<FacturaProveedor[]> {
    const query: any = { pagada: false };
    if (proveedorId) {
      query.proveedorId = new Types.ObjectId(proveedorId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    const facturas: FacturaProveedor[] = [];
    for (const facturaDoc of facturasDocs) {
      const detallesDocs = await this.detalleModel
        .find({ facturaId: facturaDoc._id })
        .exec();
      facturas.push(FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs));
    }

    return facturas;
  }

  async findPorVencer(dias: number, proveedorId?: string): Promise<FacturaProveedor[]> {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    const query: any = {
      pagada: false,
      fechaVencimiento: {
        $gte: hoy,
        $lte: fechaLimite,
      },
    };

    if (proveedorId) {
      query.proveedorId = new Types.ObjectId(proveedorId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    const facturas: FacturaProveedor[] = [];
    for (const facturaDoc of facturasDocs) {
      const detallesDocs = await this.detalleModel
        .find({ facturaId: facturaDoc._id })
        .exec();
      facturas.push(FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs));
    }

    return facturas;
  }

  async findVencidas(proveedorId?: string): Promise<FacturaProveedor[]> {
    const hoy = new Date();
    const query: any = {
      pagada: false,
      fechaVencimiento: { $lt: hoy },
    };

    if (proveedorId) {
      query.proveedorId = new Types.ObjectId(proveedorId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    const facturas: FacturaProveedor[] = [];
    for (const facturaDoc of facturasDocs) {
      const detallesDocs = await this.detalleModel
        .find({ facturaId: facturaDoc._id })
        .exec();
      facturas.push(FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs));
    }

    return facturas;
  }

  async findAll(): Promise<FacturaProveedor[]> {
    const facturasDocs = await this.facturaModel.find().sort({ fecha: -1 }).exec();

    const facturas: FacturaProveedor[] = [];
    for (const facturaDoc of facturasDocs) {
      const detallesDocs = await this.detalleModel
        .find({ facturaId: facturaDoc._id })
        .exec();
      facturas.push(FacturaProveedorMapper.toDomain(facturaDoc, detallesDocs));
    }

    return facturas;
  }
}


