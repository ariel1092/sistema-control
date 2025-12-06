// Script detallado para analizar el Excel y entender la lógica matemática
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '../../VENTAS FSG 2025.xlsx');
const workbook = XLSX.readFile(excelPath);

// Analizar la primera hoja (ENERO) en detalle
const sheetName = 'ENERO';
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1, 
  defval: null,
  raw: false 
});

console.log('='.repeat(80));
console.log(`ANÁLISIS DETALLADO: ${sheetName}`);
console.log('='.repeat(80));

// Obtener headers (primera fila)
const headers = data[0];
console.log('\n📊 COLUMNAS IDENTIFICADAS:');
console.log('-'.repeat(80));

const columnAnalysis = {};

headers.forEach((header, index) => {
  if (!header) return;
  
  const colLetter = String.fromCharCode(65 + index);
  const columnData = data.slice(1).map(row => row[index]).filter(val => 
    val !== null && val !== undefined && val !== ''
  );
  
  // Detectar tipo de columna
  let tipo = 'DESCONOCIDO';
  let valoresNumericos = [];
  
  if (typeof header === 'string') {
    if (header.includes('TARJETA')) {
      tipo = 'TARJETA_MP';
    } else if (header.includes('GASTOS')) {
      tipo = 'GASTOS';
    } else if (header.includes('CAJA')) {
      tipo = 'CAJA';
    } else if (header.includes('RESUMEN')) {
      tipo = 'RESUMEN';
    } else if (header.includes('$')) {
      tipo = 'PRODUCTO/CATEGORIA';
      // Extraer monto de referencia
      const montoRef = header.replace(/\$/g, '').replace(/,/g, '').trim();
      valoresNumericos = columnData.map(v => {
        const num = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? null : num;
      }).filter(v => v !== null);
    }
  }
  
  if (columnData.length > 0) {
    columnAnalysis[colLetter] = {
      header: String(header),
      tipo,
      cantidadValores: columnData.length,
      valoresNumericos: valoresNumericos.length,
      promedio: valoresNumericos.length > 0 
        ? (valoresNumericos.reduce((a, b) => a + b, 0) / valoresNumericos.length).toFixed(2)
        : null,
      total: valoresNumericos.length > 0
        ? valoresNumericos.reduce((a, b) => a + b, 0).toFixed(2)
        : null,
      ejemplos: columnData.slice(0, 5)
    };
    
    console.log(`\n${colLetter}: ${header}`);
    console.log(`  Tipo: ${tipo}`);
    console.log(`  Valores: ${columnData.length}`);
    if (valoresNumericos.length > 0) {
      console.log(`  Valores numéricos: ${valoresNumericos.length}`);
      console.log(`  Promedio: $${columnAnalysis[colLetter].promedio}`);
      console.log(`  Total: $${columnAnalysis[colLetter].total}`);
    }
    console.log(`  Ejemplos: ${columnAnalysis[colLetter].ejemplos.join(', ')}`);
  }
});

// Analizar algunas filas completas (días)
console.log('\n\n' + '='.repeat(80));
console.log('ANÁLISIS POR FILA (DÍAS)');
console.log('='.repeat(80));

// Analizar primeras 5 filas con datos
for (let rowIndex = 1; rowIndex < Math.min(6, data.length); rowIndex++) {
  const row = data[rowIndex];
  
  console.log(`\n📅 DÍA ${rowIndex}:`);
  console.log('-'.repeat(80));
  
  let totalVentas = 0;
  let totalTarjeta = 0;
  let gastos = [];
  let caja = null;
  let productosVendidos = [];
  
  headers.forEach((header, colIndex) => {
    const value = row[colIndex];
    if (value === null || value === undefined || value === '') return;
    
    const colLetter = String.fromCharCode(65 + colIndex);
    const colInfo = columnAnalysis[colLetter];
    
    if (!colInfo) return;
    
    if (colInfo.tipo === 'TARJETA_MP') {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        totalTarjeta = num;
        console.log(`  💳 TARJETA - MP: $${num.toFixed(2)}`);
      }
    } else if (colInfo.tipo === 'GASTOS') {
      gastos.push(String(value));
      console.log(`  💸 GASTOS: ${value}`);
    } else if (colInfo.tipo === 'CAJA') {
      caja = String(value);
      console.log(`  💵 CAJA: ${value}`);
    } else if (colInfo.tipo === 'PRODUCTO/CATEGORIA') {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        totalVentas += num;
        productosVendidos.push({
          producto: header,
          monto: num
        });
      }
    }
  });
  
  console.log(`\n  📊 RESUMEN DÍA ${rowIndex}:`);
  console.log(`    Total Ventas (suma productos): $${totalVentas.toFixed(2)}`);
  console.log(`    Total Tarjeta: $${totalTarjeta.toFixed(2)}`);
  console.log(`    Total Efectivo estimado: $${(totalVentas - totalTarjeta).toFixed(2)}`);
  console.log(`    Productos con venta: ${productosVendidos.length}`);
}

// Análisis de patrones matemáticos
console.log('\n\n' + '='.repeat(80));
console.log('ANÁLISIS DE PATRONES MATEMÁTICOS');
console.log('='.repeat(80));

// Buscar relación entre columnas de productos y totales
const filasConDatos = data.slice(1).filter(row => 
  row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
);

filasConDatos.forEach((row, rowIndex) => {
  let sumaProductos = 0;
  let tarjetaMP = 0;
  
  headers.forEach((header, colIndex) => {
    const value = row[colIndex];
    if (!value) return;
    
    const colInfo = columnAnalysis[String.fromCharCode(65 + colIndex)];
    if (!colInfo) return;
    
    if (colInfo.tipo === 'TARJETA_MP') {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) tarjetaMP = num;
    } else if (colInfo.tipo === 'PRODUCTO/CATEGORIA') {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) sumaProductos += num;
    }
  });
  
  if (sumaProductos > 0 && tarjetaMP > 0) {
    const diferencia = sumaProductos - tarjetaMP;
    const porcentajeTarjeta = ((tarjetaMP / sumaProductos) * 100).toFixed(2);
    
    console.log(`\nDía ${rowIndex + 1}:`);
    console.log(`  Suma productos: $${sumaProductos.toFixed(2)}`);
    console.log(`  Tarjeta MP: $${tarjetaMP.toFixed(2)}`);
    console.log(`  Diferencia (posible efectivo): $${diferencia.toFixed(2)}`);
    console.log(`  % Tarjeta: ${porcentajeTarjeta}%`);
  }
});

console.log('\n\n' + '='.repeat(80));
console.log('✅ ANÁLISIS COMPLETO');
console.log('='.repeat(80));












