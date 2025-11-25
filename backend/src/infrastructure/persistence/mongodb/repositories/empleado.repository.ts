import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IEmpleadoRepository } from '../../../../application/ports/empleado.repository.interface';
import { Empleado } from '../../../../domain/entities/empleado.entity';
import { EmpleadoMongo, EmpleadoDocument } from '../schemas/empleado.schema';
import { EmpleadoMapper } from '../mappers/empleado.mapper';

@Injectable()
export class EmpleadoRepository implements IEmpleadoRepository {
  constructor(
    @InjectModel(EmpleadoMongo.name)
    private empleadoModel: Model<EmpleadoDocument>,
  ) {}

  async save(empleado: Empleado): Promise<Empleado> {
    const doc = EmpleadoMapper.toPersistence(empleado);
    let empleadoDoc: EmpleadoDocument;

    if (empleado.id) {
      empleadoDoc = await this.empleadoModel.findByIdAndUpdate(
        empleado.id,
        { $set: doc },
        { new: true, upsert: false },
      );
    } else {
      empleadoDoc = await this.empleadoModel.create(doc);
    }

    if (!empleadoDoc) {
      throw new Error('Error al guardar empleado');
    }

    return EmpleadoMapper.toDomain(empleadoDoc);
  }

  async findById(id: string): Promise<Empleado | null> {
    const doc = await this.empleadoModel.findById(id);
    return doc ? EmpleadoMapper.toDomain(doc) : null;
  }

  async findByDni(dni: string): Promise<Empleado | null> {
    const doc = await this.empleadoModel.findOne({ dni });
    return doc ? EmpleadoMapper.toDomain(doc) : null;
  }

  async findAll(activos?: boolean): Promise<Empleado[]> {
    const query: any = {};
    if (activos !== undefined) {
      query.activo = activos;
    }
    const docs = await this.empleadoModel.find(query).sort({ nombre: 1 });
    return docs.map((doc) => EmpleadoMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.empleadoModel.findByIdAndDelete(id);
  }
}

