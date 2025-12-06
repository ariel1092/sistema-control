import { IncidenteUptime, EstadoIncidente } from '../../../../domain/entities/incidente-uptime.entity';
import { IncidenteUptimeMongo } from '../schemas/incidente-uptime.schema';

export class IncidenteUptimeMapper {
  static toDomain(incidenteDoc: any): IncidenteUptime {
    if (!incidenteDoc) return null;

    return new IncidenteUptime(
      incidenteDoc._id.toString(),
      incidenteDoc.startDateTime,
      incidenteDoc.endDateTime || null,
      incidenteDoc.reason,
      incidenteDoc.duration || null,
      incidenteDoc.durationSeconds || null,
      incidenteDoc.monitorUrl,
      incidenteDoc.monitorName,
      incidenteDoc.estado as EstadoIncidente,
      incidenteDoc.createdAt,
      incidenteDoc.updatedAt,
    );
  }

  static toPersistence(incidente: IncidenteUptime): any {
    const doc: any = {
      startDateTime: incidente.startDateTime,
      endDateTime: incidente.endDateTime,
      reason: incidente.reason,
      duration: incidente.duration,
      durationSeconds: incidente.durationSeconds,
      monitorUrl: incidente.monitorUrl,
      monitorName: incidente.monitorName,
      estado: incidente.estado,
    };

    if (incidente.id) {
      (doc as any)._id = incidente.id;
    }

    return doc;
  }
}

