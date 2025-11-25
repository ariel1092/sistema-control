import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IProductoRepository } from '../../../../application/ports/producto.repository.interface';
import { Producto } from '../../../../domain/entities/producto.entity';
import { ProductoMongo, ProductoDocument } from '../schemas/producto.schema';
import { ProductoMapper } from '../mappers/producto.mapper';

@Injectable()
export class ProductoRepository implements IProductoRepository {
  constructor(
    @InjectModel(ProductoMongo.name)
    private productoModel: Model<ProductoDocument>,
  ) {}

  async save(producto: Producto): Promise<Producto> {
    const productoDoc = ProductoMapper.toPersistence(producto);

    if (producto.id) {
      const updated = await this.productoModel
        .findByIdAndUpdate(producto.id, productoDoc, { new: true })
        .exec();
      return ProductoMapper.toDomain(updated);
    } else {
      const created = await this.productoModel.create(productoDoc);
      return ProductoMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<Producto | null> {
    if (!id || !Types.ObjectId.isValid(id)) {
      return null;
    }
    const productoDoc = await this.productoModel.findById(id).exec();
    return productoDoc ? ProductoMapper.toDomain(productoDoc) : null;
  }

  async findByCodigo(codigo: string): Promise<Producto | null> {
    const productoDoc = await this.productoModel.findOne({ codigo }).exec();
    return productoDoc ? ProductoMapper.toDomain(productoDoc) : null;
  }

  async search(termino: string): Promise<Producto[]> {
    const productosDocs = await this.productoModel
      .find({
        $or: [
          { nombre: { $regex: termino, $options: 'i' } },
          { descripcion: { $regex: termino, $options: 'i' } },
          { codigo: { $regex: termino, $options: 'i' } },
        ],
      })
      .limit(50)
      .exec();

    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }

  async findByCategoria(categoria: string): Promise<Producto[]> {
    const productosDocs = await this.productoModel
      .find({ categoria })
      .exec();

    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }

  async findAll(activos?: boolean): Promise<Producto[]> {
    const query: any = {};
    if (activos !== undefined) {
      query.activo = activos;
    }

    const productosDocs = await this.productoModel.find(query).exec();
    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }

  async update(producto: Producto): Promise<Producto> {
    return this.save(producto);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: marcar como inactivo
    await this.productoModel
      .findByIdAndUpdate(id, { activo: false })
      .exec();
  }

  async findByIds(ids: string[]): Promise<Producto[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const productosDocs = await this.productoModel
      .find({ _id: { $in: objectIds } })
      .exec();

    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }
}

