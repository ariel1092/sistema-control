import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IRemitoProveedorRepository } from '../../../../application/ports/remito-proveedor.repository.interface';
import { RemitoProveedor } from '../../../../domain/entities/remito-proveedor.entity';
import { RemitoProveedorMongo, RemitoProveedorDocument } from '../schemas/remito-proveedor.schema';
import { DetalleRemitoMongo, DetalleRemitoDocument } from '../schemas/detalle-remito.schema';
import { RemitoProveedorMapper } from '../mappers/remito-proveedor.mapper';

@Injectable()
export class RemitoProveedorRepository implements IRemitoProveedorRepository {
  constructor(
    @InjectModel(RemitoProveedorMongo.name)
    private remitoModel: Model<RemitoProveedorDocument>,
    @InjectModel(DetalleRemitoMongo.name)
    private detalleModel: Model<DetalleRemitoDocument>,
  ) {}

  async save(remito: RemitoProveedor): Promise<RemitoProveedor> {
    const { remito: remitoDoc, detalles: detallesDocs } = RemitoProveedorMapper.toPersistence(remito);

    let remitoGuardado;
    if (remito.id) {
      remitoGuardado = await this.remitoModel
        .findByIdAndUpdate(remito.id, remitoDoc, { new: true })
        .exec();

      await this.detalleModel.deleteMany({
        remitoId: new Types.ObjectId(remito.id),
      }).exec();
    } else {
      remitoGuardado = await this.remitoModel.create(remitoDoc);
    }

    const detallesGuardados = await this.detalleModel.insertMany(
      detallesDocs.map((det) => ({
        ...det,
        remitoId: remitoGuardado._id,
      })),
    );

    return RemitoProveedorMapper.toDomain(remitoGuardado, detallesGuardados as any[]);
  }

  async findById(id: string): Promise<RemitoProveedor | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const remitoDoc = await this.remitoModel.findById(id).exec();
    if (!remitoDoc) return null;

    const detallesDocs = await this.detalleModel
      .find({ remitoId: new Types.ObjectId(id) })
      .exec();

    return RemitoProveedorMapper.toDomain(remitoDoc, detallesDocs);
  }

  async findByProveedor(proveedorId: string): Promise<RemitoProveedor[]> {
    const remitosDocs = await this.remitoModel
      .find({ proveedorId: new Types.ObjectId(proveedorId) })
      .sort({ fecha: -1 })
      .exec();

    const remitos: RemitoProveedor[] = [];
    for (const remitoDoc of remitosDocs) {
      const detallesDocs = await this.detalleModel
        .find({ remitoId: remitoDoc._id })
        .exec();
      remitos.push(RemitoProveedorMapper.toDomain(remitoDoc, detallesDocs));
    }

    return remitos;
  }

  async findByOrdenCompra(ordenCompraId: string): Promise<RemitoProveedor | null> {
    const remitoDoc = await this.remitoModel
      .findOne({ ordenCompraId: new Types.ObjectId(ordenCompraId) })
      .exec();

    if (!remitoDoc) return null;

    const detallesDocs = await this.detalleModel
      .find({ remitoId: remitoDoc._id })
      .exec();

    return RemitoProveedorMapper.toDomain(remitoDoc, detallesDocs);
  }

  async findSinFacturar(proveedorId?: string): Promise<RemitoProveedor[]> {
    const query: any = { facturado: false };
    if (proveedorId) {
      query.proveedorId = new Types.ObjectId(proveedorId);
    }

    const remitosDocs = await this.remitoModel
      .find(query)
      .sort({ fecha: -1 })
      .exec();

    const remitos: RemitoProveedor[] = [];
    for (const remitoDoc of remitosDocs) {
      const detallesDocs = await this.detalleModel
        .find({ remitoId: remitoDoc._id })
        .exec();
      remitos.push(RemitoProveedorMapper.toDomain(remitoDoc, detallesDocs));
    }

    return remitos;
  }

  async findAll(): Promise<RemitoProveedor[]> {
    const remitosDocs = await this.remitoModel.find().sort({ fecha: -1 }).exec();

    const remitos: RemitoProveedor[] = [];
    for (const remitoDoc of remitosDocs) {
      const detallesDocs = await this.detalleModel
        .find({ remitoId: remitoDoc._id })
        .exec();
      remitos.push(RemitoProveedorMapper.toDomain(remitoDoc, detallesDocs));
    }

    return remitos;
  }
}


