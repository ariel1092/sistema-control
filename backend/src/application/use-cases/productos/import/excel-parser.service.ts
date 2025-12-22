import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { 
  ExcelImportResult, 
  ExcelMeta, 
  ColumnMapping, 
  ExcelProducto, 
  ExcelError 
} from './excel-parser.types';
import { 
  limpiarPrecio, 
  limpiarPorcentaje, 
  parsearFechaExcel, 
  validarProducto 
} from './excel-parser.utils';

@Injectable()
export class ExcelParserService {
  /**
   * Procesa un buffer de Excel y devuelve la estructura solicitada
   */
  public parse(buffer: Buffer): ExcelImportResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a matriz 2D (rows[fila][columna])
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: null });
    
    const meta = this.extraerMetadata(rows);
    const mapping = this.detectarColumnas(rows);
    
    if (!mapping) {
      return {
        meta,
        productos: [],
        errores: [{ fila: 0, mensaje: 'No se pudo detectar la tabla principal (COD, ART, DCTO, VENTA)' }]
      };
    }

    const { productos, errores } = this.procesarProductos(rows, mapping);

    return {
      meta,
      productos,
      errores
    };
  }

  /**
   * Busca en toda la hoja los valores globales (DCTO, MG, FECHA)
   */
  private extraerMetadata(rows: any[][]): ExcelMeta {
    const meta: ExcelMeta = {
      descuentoGlobal: null,
      margenGanancia: null,
      fecha: null
    };

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const cell = rows[i][j];
        if (typeof cell !== 'string') continue;

        const valorLimpio = cell.toUpperCase().trim();
        const nextCell = rows[i][j + 1];

        if (valorLimpio === 'DCTO' && !meta.descuentoGlobal) {
          meta.descuentoGlobal = limpiarPorcentaje(nextCell);
        } else if (valorLimpio === 'MG' && !meta.margenGanancia) {
          meta.margenGanancia = limpiarPorcentaje(nextCell);
        } else if (valorLimpio === 'FECHA' && !meta.fecha) {
          meta.fecha = parsearFechaExcel(nextCell);
        }
      }
    }

    return meta;
  }

  /**
   * Busca la fila de encabezados y mapea los índices
   */
  private detectarColumnas(rows: any[][]): ColumnMapping | null {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      const mapping: Partial<ColumnMapping> = {};
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toUpperCase().trim();
        if (cell === 'COD') mapping.cod = j;
        if (cell === 'ART') mapping.art = j;
        if (cell === 'DCTO') mapping.dcto = j;
        if (cell === 'VENTA') mapping.venta = j;
      }

      if (mapping.cod !== undefined && mapping.art !== undefined && 
          mapping.dcto !== undefined && mapping.venta !== undefined) {
        // Encontramos la fila de encabezados
        (mapping as any).headerRowIndex = i;
        return mapping as ColumnMapping;
      }
    }
    return null;
  }

  /**
   * Itera sobre las filas de productos validando y sanitizando cada una
   */
  private procesarProductos(rows: any[][], mapping: ColumnMapping): { productos: ExcelProducto[], errores: ExcelError[] } {
    const productos: ExcelProducto[] = [];
    const errores: ExcelError[] = [];
    const startIndex = (mapping as any).headerRowIndex + 1;

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawCod = row[mapping.cod];
      const rawArt = row[mapping.art];
      
      // Si ambos están vacíos, saltar fila
      if (!rawCod && !rawArt) continue;

      // Si el nombre contiene rubros o separadores, saltar
      const nombreStr = String(rawArt || '').trim();
      if (nombreStr.includes('----------') || nombreStr.toUpperCase().includes('RUBRO:')) {
        continue;
      }

      const rawDcto = row[mapping.dcto];
      const rawVenta = row[mapping.venta];

      const costo = limpiarPrecio(rawDcto);
      const venta = limpiarPrecio(rawVenta);
      const codigo = String(rawCod || '').trim();
      const nombre = nombreStr;

      // Calcular IVA y Costo Real para el preview basado en las reglas del negocio
      // PL * 1.21
      const precioIva = limpiarPrecio(row[mapping.dcto - 1]) * 1.21; // Asumiendo que PL está antes de IVA/DCTO
      
      const producto: ExcelProducto = {
        codigo,
        nombre,
        costo,
        venta,
        filaExcel: i + 1
      };

      const erroresFila = validarProducto(producto, i + 1);
      
      if (erroresFila.length > 0) {
        errores.push(...erroresFila);
      } else {
        productos.push(producto);
      }
    }

    return { productos, errores };
  }
}

