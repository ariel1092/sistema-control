export enum EstadoComprobanteFiscal {
  BORRADOR = 'BORRADOR',
  EMITIDO = 'EMITIDO', // legacy: estado interno previo a agregar pipeline AFIP
  PENDIENTE_AFIP = 'PENDIENTE_AFIP',
  AUTORIZADO = 'AUTORIZADO',
  ANULADO = 'ANULADO',
}


