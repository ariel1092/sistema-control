import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportarProductosExcelUseCase {
    constructor(
        @Inject('IProductoRepository')
        private readonly productoRepository: IProductoRepository,
        @Inject('IProveedorRepository')
        private readonly proveedorRepository: IProveedorRepository,
    ) { }

    async execute(buffer: Buffer, proveedorId?: string): Promise<{
        procesados: number;
        creados: number;
        actualizados: number;
        errores: any[];
    }> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let procesados = 0;
        let creados = 0;
        let actualizados = 0;
        const errores: any[] = [];

        // Si se pasa proveedorId, obtener su descuento y margen
        let descuentoProveedor = 0;
        let margenGananciaProveedor = 100;
        if (proveedorId) {
            const proveedor = await this.proveedorRepository.findById(proveedorId);
            if (proveedor) {
                descuentoProveedor = proveedor.descuento || 0;
                margenGananciaProveedor = proveedor.margenGanancia || 100;
            }
        }

        console.log(`Hojas en Excel: ${workbook.SheetNames.join(', ')}`);

        // Procesar todas las hojas por si los datos no están en la primera
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            console.log(`Procesando hoja "${sheetName}" con ${data.length} filas.`);
            if (data.length > 0) {
                console.log(`Cabeceras detectadas: ${Object.keys(data[0]).join(', ')}`);
            }

            for (const rawRow of data) {
                // Ignorar filas vacías o que parecen ser de relleno
                if (!rawRow || Object.keys(rawRow).length < 2) continue;

                procesados++;
                try {
                    const row: any = {};
                    Object.keys(rawRow).forEach((key) => {
                        if (key) row[key.toLowerCase().trim()] = rawRow[key];
                    });

                    // Mapeo flexible
                    const codigo = (row['cod'] || row['codigo'] || row['art'])?.toString().trim();
                    const nombre = (row['art'] || row['articulo'] || row['nombre'] || row['artículo'])?.toString().trim();
                    const categoria = (row['categoria'] || row['rubro'] || row['seccion'] || 'General')?.toString().trim();

                    // Precio venta: soportar 'venta', 'p. venta', 'precio', etc.
                    const precioVentaRaw = row['venta'] || row['precioventa'] || row['precio'] || row['p. venta'] || row['p.venta'] || row['p.venta'];
                    const precioVenta = typeof precioVentaRaw === 'number' ? precioVentaRaw : parseFloat(precioVentaRaw);

                    // Precio costo: 'pl' (Precio Lista), 'costo', etc.
                    const precioCostoRaw = row['preciocosto'] || row['pl'] || row['costo'] || row['p. lista'] || row['p.lista'];
                    const precioCosto = typeof precioCostoRaw === 'number' ? precioCostoRaw : (parseFloat(precioCostoRaw) || 0);

                    // Descuento: 'dcto', 'descuento', etc.
                    const descuentoRaw = row['dcto'] || row['descuento'];
                    const descuento = typeof descuentoRaw === 'number' ? descuentoRaw : (parseFloat(descuentoRaw) || 0);

                    // IVA: 'iva'
                    const ivaRaw = row['iva'];
                    const iva = typeof ivaRaw === 'number' ? ivaRaw : (parseFloat(ivaRaw) || 21);

                    // CALCULO DE PRECIO VENTA DEL SISTEMA
                    const porcentajeDescuento = proveedorId ? descuentoProveedor : (descuento || 0);
                    const porcentajeMargen = proveedorId ? margenGananciaProveedor : 100;
                    
                    // Lógica solicitada:
                    // 1. IVA Amount = PL * 1.21
                    const precioConIva = precioCosto * 1.21;
                    
                    // 2. Costo Real (DCTO) = Precio con IVA * (1 - %DescuentoProveedor / 100)
                    const precioConDescuento = precioConIva * (1 - porcentajeDescuento / 100);
                    
                    // 3. Precio Venta Final = Precio con Descuento * (Margen / 100)
                    const precioVentaCalculado = precioConDescuento * (porcentajeMargen / 100);

                    // Si el nombre contiene palabras como "RUBRO" o parece ser una cabecera de sección, saltar
                    if (nombre && (nombre.includes('----------') || nombre.toUpperCase().includes('RUBRO:'))) {
                        procesados--; // No contar como procesado real
                        continue;
                    }

                    // Validaciones básicas
                    if (!codigo || !nombre || isNaN(precioVenta)) {
                        // Solo registrar error si la fila tiene al menos algo de contenido relevante
                        if (nombre || codigo) {
                            let missing = [];
                            if (!codigo) missing.push('codigo/art');
                            if (!nombre) missing.push('nombre');
                            if (isNaN(precioVenta)) missing.push('precio(venta)');

                            errores.push({
                                fila: procesados,
                                error: `Datos incompletos: ${missing.join(', ')}`,
                                data: JSON.stringify(row).substring(0, 100),
                            });
                        } else {
                            procesados--;
                        }
                        continue;
                    }

                    const existente = await this.productoRepository.findByCodigo(codigo);

                    if (existente) {
                        const actualizado = new Producto(
                            existente.id,
                            existente.codigo,
                            nombre,
                            categoria,
                            proveedorId || existente.proveedorId,
                            precioVentaCalculado, // Usar el calculado por el sistema
                            row['stockactual'] !== undefined ? parseFloat(row['stockactual']) : existente.stockActual,
                            row['stockminimo'] !== undefined ? parseFloat(row['stockminimo']) : existente.stockMinimo,
                            row['unidadmedida'] || row['unidad'] || existente.unidadMedida,
                            row['activo'] !== undefined ? String(row['activo']).toLowerCase() === 'true' || row['activo'] === true : existente.activo,
                            porcentajeDescuento, // El % del proveedor o del excel
                            iva || existente.iva,
                            row['descripcion'] || existente.descripcion,
                            row['marca'] || existente.marca,
                            precioCosto || existente.precioCosto,
                            row['codigobarras'] || row['barras'] || existente.codigoBarras,
                            existente.createdAt,
                            new Date(),
                        );

                        await this.productoRepository.update(actualizado);
                        actualizados++;
                    } else {
                        const nuevo = Producto.crear({
                            codigo,
                            nombre,
                            categoria,
                            proveedorId,
                            precioVenta: precioVentaCalculado, // Usar el calculado por el sistema
                            stockActual: parseFloat(row['stockactual']) || 0,
                            stockMinimo: parseFloat(row['stockminimo']) || 0,
                            unidadMedida: row['unidadmedida'] || row['unidad'] || 'UN',
                            descripcion: row['descripcion'],
                            marca: row['marca'],
                            codigoBarras: row['codigobarras'] || row['barras'],
                            precioCosto: precioCosto || 0,
                            descuento: porcentajeDescuento,
                            iva: iva,
                            activo: true,
                        });

                        await this.productoRepository.save(nuevo);
                        creados++;
                    }
                } catch (error: any) {
                    errores.push({ fila: procesados, error: error.message });
                }
            }
        }

        return { procesados, creados, actualizados, errores };
    }
}
