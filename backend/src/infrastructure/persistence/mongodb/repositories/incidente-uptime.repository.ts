import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IIncidenteUptimeRepository } from '../../../../application/ports/incidente-uptime.repository.interface';
import { IncidenteUptime } from '../../../../domain/entities/incidente-uptime.entity';
import { EstadoIncidente } from '../../../../domain/entities/incidente-uptime.entity';
import { IncidenteUptimeMongo, IncidenteUptimeDocument } from '../schemas/incidente-uptime.schema';
import { IncidenteUptimeMapper } from '../mappers/incidente-uptime.mapper';

@Injectable()
export class IncidenteUptimeRepository implements IIncidenteUptimeRepository {
  constructor(
    @InjectModel(IncidenteUptimeMongo.name)
    private incidenteModel: Model<IncidenteUptimeDocument>,
  ) {}

  async save(incidente: IncidenteUptime): Promise<IncidenteUptime> {
    const incidenteDoc = IncidenteUptimeMapper.toPersistence(incidente);

    if (incidente.id) {
      const updated = await this.incidenteModel
        .findByIdAndUpdate(incidente.id, incidenteDoc, { new: true })
        .exec();
      return IncidenteUptimeMapper.toDomain(updated);
    } else {
      const created = await this.incidenteModel.create(incidenteDoc);
      return IncidenteUptimeMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<IncidenteUptime | null> {
    const incidenteDoc = await this.incidenteModel.findById(id).exec();
    return incidenteDoc ? IncidenteUptimeMapper.toDomain(incidenteDoc) : null;
  }

  async findAll(fechaInicio?: Date, fechaFin?: Date, monitorName?: string): Promise<IncidenteUptime[]> {
    const query: any = {};

    if (fechaInicio || fechaFin) {
      query.startDateTime = {};
      if (fechaInicio) {
        query.startDateTime.$gte = fechaInicio;
      }
      if (fechaFin) {
        query.startDateTime.$lte = fechaFin;
      }
    }

    if (monitorName) {
      query.monitorName = monitorName;
    }

    const incidentesDocs = await this.incidenteModel
      .find(query)
      .sort({ startDateTime: -1 })
      .exec();
    return incidentesDocs.map((doc) => IncidenteUptimeMapper.toDomain(doc));
  }

  async findAbiertos(): Promise<IncidenteUptime[]> {
    const incidentesDocs = await this.incidenteModel
      .find({ estado: EstadoIncidente.ABIERTO })
      .sort({ startDateTime: -1 })
      .exec();
    return incidentesDocs.map((doc) => IncidenteUptimeMapper.toDomain(doc));
  }

  async findCerrados(fechaInicio?: Date, fechaFin?: Date): Promise<IncidenteUptime[]> {
    const query: any = { estado: EstadoIncidente.CERRADO };

    if (fechaInicio || fechaFin) {
      query.startDateTime = {};
      if (fechaInicio) {
        query.startDateTime.$gte = fechaInicio;
      }
      if (fechaFin) {
        query.startDateTime.$lte = fechaFin;
      }
    }

    const incidentesDocs = await this.incidenteModel
      .find(query)
      .sort({ startDateTime: -1 })
      .exec();
    return incidentesDocs.map((doc) => IncidenteUptimeMapper.toDomain(doc));
  }

  async findByMonitorName(monitorName: string, fechaInicio?: Date, fechaFin?: Date): Promise<IncidenteUptime[]> {
    const query: any = { monitorName };

    if (fechaInicio || fechaFin) {
      query.startDateTime = {};
      if (fechaInicio) {
        query.startDateTime.$gte = fechaInicio;
      }
      if (fechaFin) {
        query.startDateTime.$lte = fechaFin;
      }
    }

    const incidentesDocs = await this.incidenteModel
      .find(query)
      .sort({ startDateTime: -1 })
      .exec();
    return incidentesDocs.map((doc) => IncidenteUptimeMapper.toDomain(doc));
  }

  async update(incidente: IncidenteUptime): Promise<IncidenteUptime> {
    return this.save(incidente);
  }

  async delete(id: string): Promise<void> {
    await this.incidenteModel.findByIdAndDelete(id).exec();
  }

  async getEstadisticas(fechaInicio: Date, fechaFin: Date): Promise<{
    totalIncidentes: number;
    incidentesAbiertos: number;
    incidentesCerrados: number;
    tiempoTotalFuera: number;
    tiempoPromedioFuera: number;
    uptimePercentage: number;
  }> {
    const query = {
      startDateTime: {
        $gte: fechaInicio,
        $lte: fechaFin,
      },
    };

    const [total, abiertos, cerrados] = await Promise.all([
      this.incidenteModel.countDocuments(query),
      this.incidenteModel.countDocuments({ ...query, estado: EstadoIncidente.ABIERTO }),
      this.incidenteModel.countDocuments({ ...query, estado: EstadoIncidente.CERRADO }),
    ]);

    // Calcular tiempo total fuera (solo incidentes cerrados)
    const incidentesCerradosDocs = await this.incidenteModel
      .find({ ...query, estado: EstadoIncidente.CERRADO, durationSeconds: { $exists: true, $ne: null } })
      .exec();

    const tiempoTotalFuera = incidentesCerradosDocs.reduce((acc, doc) => {
      return acc + (doc.durationSeconds || 0);
    }, 0);

    const tiempoPromedioFuera = cerrados > 0 ? tiempoTotalFuera / cerrados : 0;

    // Calcular uptime percentage
    const periodoTotal = fechaFin.getTime() - fechaInicio.getTime();
    const periodoDisponible = periodoTotal - (tiempoTotalFuera * 1000);
    const uptimePercentage = periodoTotal > 0 ? (periodoDisponible / periodoTotal) * 100 : 100;

    return {
      totalIncidentes: total,
      incidentesAbiertos: abiertos,
      incidentesCerrados: cerrados,
      tiempoTotalFuera,
      tiempoPromedioFuera,
      uptimePercentage: Math.max(0, Math.min(100, uptimePercentage)),
    };
  }
}

