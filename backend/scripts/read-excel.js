// Script temporal para leer el archivo Excel y analizar su estructura
const fs = require('fs');
const path = require('path');

// Intentar leer con xlsx (si está instalado) o mostrar estructura básica
try {
  const XLSX = require('xlsx');
  
  const excelPath = path.join(__dirname, '../../VENTAS FSG 2025.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.log('ERROR: No se encuentra el archivo Excel en:', excelPath);
    process.exit(1);
  }
  
  console.log('📊 Leyendo archivo Excel:', excelPath);
  console.log('---\n');
  
  const workbook = XLSX.readFile(excelPath);
  
  // Listar todas las hojas
  console.log('📑 Hojas encontradas:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  console.log('---\n');
  
  // Analizar cada hoja
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n📋 HOJA: ${sheetName}`);
    console.log('=' .repeat(60));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, 
      defval: null,
      header: 1 // Mantener estructura de filas
    });
    
    if (data.length === 0) {
      console.log('  (Hoja vacía)\n');
      return;
    }
    
    // Mostrar estructura de columnas (primera fila)
    if (data.length > 0) {
      console.log('\n📊 Columnas (primera fila):');
      const headers = data[0];
      headers.forEach((header, index) => {
        if (header) {
          console.log(`  Columna ${String.fromCharCode(65 + index)}: "${header}"`);
        }
      });
    }
    
    // Mostrar cantidad de filas con datos
    const rowsWithData = data.filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    ).length;
    
    console.log(`\n📈 Filas con datos: ${rowsWithData}`);
    
    // Mostrar primeras 3 filas de datos (después de headers)
    if (data.length > 1) {
      console.log('\n📝 Primeras filas de datos:');
      const previewRows = data.slice(1, Math.min(4, data.length));
      previewRows.forEach((row, index) => {
        const rowData = {};
        const headers = data[0];
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex] !== undefined) {
            rowData[header] = row[colIndex];
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          console.log(`\n  Fila ${index + 2}:`);
          Object.entries(rowData).slice(0, 10).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              const strValue = String(value).substring(0, 50);
              console.log(`    ${key}: ${strValue}`);
            }
          });
          if (Object.keys(rowData).length > 10) {
            console.log(`    ... y ${Object.keys(rowData).length - 10} columnas más`);
          }
        }
      });
    }
    
    // Analizar tipos de datos en columnas numéricas
    if (data.length > 1) {
      console.log('\n🔢 Análisis de columnas numéricas:');
      const headers = data[0];
      headers.forEach((header, colIndex) => {
        if (!header) return;
        
        const columnData = data.slice(1).map(row => row[colIndex]).filter(val => 
          val !== null && val !== undefined && val !== ''
        );
        
        if (columnData.length > 0) {
          const numericValues = columnData.filter(val => {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            return !isNaN(num);
          });
          
          if (numericValues.length > 0 && numericValues.length === columnData.length * 0.7) {
            const nums = numericValues.map(v => parseFloat(String(v).replace(/[^0-9.-]/g, '')));
            const sum = nums.reduce((a, b) => a + b, 0);
            const avg = sum / nums.length;
            console.log(`  ${header}: ${numericValues.length} valores numéricos, promedio: ${avg.toFixed(2)}`);
          }
        }
      });
    }
    
    console.log('\n');
  });
  
  // Generar resumen JSON
  console.log('\n' + '='.repeat(60));
  console.log('📦 RESUMEN ESTRUCTURAL');
  console.log('='.repeat(60));
  
  const summary = {
    totalSheets: workbook.SheetNames.length,
    sheets: workbook.SheetNames.map(sheetName => {
      const ws = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const rowsWithData = data.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
      ).length;
      
      return {
        name: sheetName,
        totalRows: rowsWithData,
        columns: data[0] || [],
        columnCount: (data[0] || []).filter(h => h).length
      };
    })
  };
  
  console.log(JSON.stringify(summary, null, 2));
  
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  La librería "xlsx" no está instalada.');
    console.log('📦 Instalando xlsx...\n');
    
    const { execSync } = require('child_process');
    try {
      execSync('npm install xlsx --no-save', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit' 
      });
      console.log('\n✅ Instalación completa. Ejecuta el script nuevamente.');
    } catch (installError) {
      console.error('❌ Error al instalar xlsx:', installError.message);
      console.log('\n💡 Instala manualmente: npm install xlsx');
    }
  } else {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}





