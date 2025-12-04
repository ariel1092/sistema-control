import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProveedorRepository } from '../../../../application/ports/proveedor.repository.interface';
import { Proveedor } from '../../../../domain/entities/proveedor.entity';
import { ProveedorMongo, ProveedorDocument } from '../schemas/proveedor.schema';
import { ProveedorMapper } from '../mappers/proveedor.mapper';
import { Types } from 'mongoose';

@Injectable()
export class ProveedorRepository implements IProveedorRepository {
  constructor(
    @InjectModel(ProveedorMongo.name)
    private proveedorModel: Model<ProveedorDocument>,
  ) {}

  async save(proveedor: Proveedor): Promise<Proveedor> {
    const proveedorDoc = ProveedorMapper.toPersistence(proveedor);

    if (proveedor.id) {
      const updated = await this.proveedorModel
        .findByIdAndUpdate(proveedor.id, proveedorDoc, { new: true })
        .exec();
      return ProveedorMapper.toDomain(updated);
    } else {
      const created = await this.proveedorModel.create(proveedorDoc);
      return ProveedorMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<Proveedor | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const proveedorDoc = await this.proveedorModel.findById(id).exec();
    return proveedorDoc ? ProveedorMapper.toDomain(proveedorDoc) : null;
  }

  async findAll(activo?: boolean): Promise<Proveedor[]> {
    const query: any = {};
    if (activo !== undefined) {
      query.activo = activo;
    }
    const proveedoresDocs = await this.proveedorModel.find(query).sort({ nombre: 1 }).exec();
    return proveedoresDocs.map((doc) => ProveedorMapper.toDomain(doc));
  }

  async findByCategoria(categoria: string): Promise<Proveedor[]> {
    const proveedoresDocs = await this.proveedorModel
      .find({ categoria, activo: true })
      .sort({ nombre: 1 })
      .exec();
    return proveedoresDocs.map((doc) => ProveedorMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.proveedorModel.findByIdAndUpdate(id, { activo: false }).exec();
  }
}





