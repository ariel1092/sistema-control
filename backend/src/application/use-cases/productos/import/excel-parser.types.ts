export interface ExcelMeta {
  descuentoGlobal: number | null;
  margenGanancia: number | null;
  fecha: Date | null;
}

export interface ExcelProducto {
  codigo: string;
  nombre: string;
  costo: number;
  venta: number;
  filaExcel: number;
}

export interface ExcelError {
  fila: number;
  codigo?: string;
  mensaje: string;
}

export interface ExcelImportResult {
  meta: ExcelMeta;
  productos: ExcelProducto[];
  errores: ExcelError[];
}

export interface ColumnMapping {
  cod: number;
  art: number;
  dcto: number;
  venta: number;
}





