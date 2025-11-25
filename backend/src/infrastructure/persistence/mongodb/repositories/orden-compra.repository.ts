import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IOrdenCompraRepository } from '../../../../application/ports/orden-compra.repository.interface';
import { OrdenCompra } from '../../../../domain/entities/orden-compra.entity';
import { OrdenCompraMongo, OrdenCompraDocument } from '../schemas/orden-compra.schema';
import { DetalleOrdenCompraMongo, DetalleOrdenCompraDocument } from '../schemas/detalle-orden-compra.schema';
import { OrdenCompraMapper } from '../mappers/orden-compra.mapper';
import { EstadoOrdenCompra } from '../../../../domain/enums/estado-orden-compra.enum';

@Injectable()
export class OrdenCompraRepository implements IOrdenCompraRepository {
  constructor(
    @InjectModel(OrdenCompraMongo.name)
    private ordenModel: Model<OrdenCompraDocument>,
    @InjectModel(DetalleOrdenCompraMongo.name)
    private detalleModel: Model<DetalleOrdenCompraDocument>,
  ) {}

  async save(orden: OrdenCompra): Promise<OrdenCompra> {
    const { orden: ordenDoc, detalles: detallesDocs } = OrdenCompraMapper.toPersistence(orden);

    let ordenGuardada;
    if (orden.id) {
      ordenGuardada = await this.ordenModel
        .findByIdAndUpdate(orden.id, ordenDoc, { new: true })
        .exec();

      await this.detalleModel.deleteMany({
        ordenCompraId: new Types.ObjectId(orden.id),
      }).exec();
    } else {
      ordenGuardada = await this.ordenModel.create(ordenDoc);
    }

    const detallesGuardados = await this.detalleModel.insertMany(
      detallesDocs.map((det) => ({
        ...det,
        ordenCompraId: ordenGuardada._id,
      })),
    );

    return OrdenCompraMapper.toDomain(ordenGuardada, detallesGuardados as any[]);
  }

  async findById(id: string): Promise<OrdenCompra | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const ordenDoc = await this.ordenModel.findById(id).exec();
    if (!ordenDoc) return null;

    const detallesDocs = await this.detalleModel
      .find({ ordenCompraId: new Types.ObjectId(id) })
      .exec();

    return OrdenCompraMapper.toDomain(ordenDoc, detallesDocs);
  }

  async findByProveedor(proveedorId: string): Promise<OrdenCompra[]> {
    const ordenesDocs = await this.ordenModel
      .find({ proveedorId: new Types.ObjectId(proveedorId) })
      .sort({ fecha: -1 })
      .exec();

    const ordenes: OrdenCompra[] = [];
    for (const ordenDoc of ordenesDocs) {
      const detallesDocs = await this.detalleModel
        .find({ ordenCompraId: ordenDoc._id })
        .exec();
      ordenes.push(OrdenCompraMapper.toDomain(ordenDoc, detallesDocs));
    }

    return ordenes;
  }

  async findByEstado(estado: EstadoOrdenCompra): Promise<OrdenCompra[]> {
    const ordenesDocs = await this.ordenModel
      .find({ estado })
      .sort({ fecha: -1 })
      .exec();

    const ordenes: OrdenCompra[] = [];
    for (const ordenDoc of ordenesDocs) {
      const detallesDocs = await this.detalleModel
        .find({ ordenCompraId: ordenDoc._id })
        .exec();
      ordenes.push(OrdenCompraMapper.toDomain(ordenDoc, detallesDocs));
    }

    return ordenes;
  }

  async findAll(): Promise<OrdenCompra[]> {
    const ordenesDocs = await this.ordenModel.find().sort({ fecha: -1 }).exec();

    const ordenes: OrdenCompra[] = [];
    for (const ordenDoc of ordenesDocs) {
      const detallesDocs = await this.detalleModel
        .find({ ordenCompraId: ordenDoc._id })
        .exec();
      ordenes.push(OrdenCompraMapper.toDomain(ordenDoc, detallesDocs));
    }

    return ordenes;
  }
}


