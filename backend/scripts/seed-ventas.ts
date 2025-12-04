import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { CreateVentaUseCase } from '../src/application/use-cases/ventas/create-venta.use-case';
import { CreateProductoUseCase } from '../src/application/use-cases/productos/create-producto.use-case';
import { CreateGastoDiarioUseCase } from '../src/application/use-cases/gasto-diario/create-gasto-diario.use-case';
import { CreateRetiroSocioUseCase } from '../src/application/use-cases/retiro-socio/create-retiro-socio.use-case';
import { CreateProveedorUseCase } from '../src/application/use-cases/proveedor/create-proveedor.use-case';
import { IProductoRepository } from '../src/application/ports/producto.repository.interface';
import { TipoMetodoPago } from '../src/domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../src/domain/enums/tipo-comprobante.enum';
import { CuentaBancaria } from '../src/domain/enums/cuenta-bancaria.enum';
import { CategoriaGasto, MetodoPagoGasto } from '../src/domain/entities/gasto-diario.entity';
import { CategoriaProveedor } from '../src/domain/enums/categoria-proveedor.enum';
import { FormaPagoHabitual } from '../src/domain/entities/proveedor.entity';
import { Types } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const createVentaUseCase = app.get(CreateVentaUseCase);
  const createProductoUseCase = app.get(CreateProductoUseCase);
  const createGastoDiarioUseCase = app.get(CreateGastoDiarioUseCase);
  const createRetiroSocioUseCase = app.get(CreateRetiroSocioUseCase);
  const createProveedorUseCase = app.get(CreateProveedorUseCase);
  const productoRepository = app.get<IProductoRepository>('IProductoRepository');

  console.log('🌱 Iniciando seed completo del sistema...\n');

  // ============================================
  // 1. CREAR PRODUCTOS
  // ============================================
  console.log('📦 Creando productos...');
  const productos = [
    { codigo: 'PROD001', nombre: 'Martillo', precioVenta: 5000, stockActual: 10000, categoria: 'Herramientas', stockMinimo: 10, unidadMedida: 'UNIDAD' },
    { codigo: 'PROD002', nombre: 'Destornillador', precioVenta: 3000, stockActual: 10000, categoria: 'Herramientas', stockMinimo: 10, unidadMedida: 'UNIDAD' },
    { codigo: 'PROD003', nombre: 'Clavos', precioVenta: 2000, stockActual: 10000, categoria: 'Fijaciones', stockMinimo: 50, unidadMedida: 'KG' },
    { codigo: 'PROD004', nombre: 'Tornillos', precioVenta: 2500, stockActual: 10000, categoria: 'Fijaciones', stockMinimo: 50, unidadMedida: 'KG' },
    { codigo: 'PROD005', nombre: 'Pintura', precioVenta: 15000, stockActual: 10000, categoria: 'Pinturas', stockMinimo: 5, unidadMedida: 'LITRO' },
    { codigo: 'PROD006', nombre: 'Brocha', precioVenta: 4000, stockActual: 10000, categoria: 'Pinturas', stockMinimo: 10, unidadMedida: 'UNIDAD' },
    { codigo: 'PROD007', nombre: 'Cable', precioVenta: 8000, stockActual: 10000, categoria: 'Electricidad', stockMinimo: 20, unidadMedida: 'METRO' },
    { codigo: 'PROD008', nombre: 'Bombilla', precioVenta: 1500, stockActual: 10000, categoria: 'Electricidad', stockMinimo: 20, unidadMedida: 'UNIDAD' },
    { codigo: 'PROD009', nombre: 'Cemento', precioVenta: 12000, stockActual: 10000, categoria: 'Construcción', stockMinimo: 10, unidadMedida: 'BOLSA' },
    { codigo: 'PROD010', nombre: 'Ladrillos', precioVenta: 500, stockActual: 10000, categoria: 'Construcción', stockMinimo: 100, unidadMedida: 'UNIDAD' },
  ];

  const productosIds: string[] = [];
  const productosData: Array<{ id: string; codigo: string; nombre: string; precioVenta: number }> = [];
  
  for (const producto of productos) {
    try {
      const productoCreado = await createProductoUseCase.execute(producto);
      if (productoCreado.id && Types.ObjectId.isValid(productoCreado.id)) {
        productosIds.push(productoCreado.id);
        productosData.push({
          id: productoCreado.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          precioVenta: producto.precioVenta,
        });
      }
    } catch (err) {
      try {
        const productoExistente = await productoRepository.findByCodigo(producto.codigo);
        if (productoExistente?.id && Types.ObjectId.isValid(productoExistente.id)) {
          (productoExistente as any).stockActual = producto.stockActual;
          await productoRepository.update(productoExistente);
          productosIds.push(productoExistente.id);
          productosData.push({
            id: productoExistente.id,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precioVenta: producto.precioVenta,
          });
        }
      } catch (err2) {
        console.error(`❌ Error con producto ${producto.nombre}`);
      }
    }
  }

  console.log(`✅ ${productosData.length} productos disponibles\n`);

  // ============================================
  // 2. CREAR PROVEEDORES
  // ============================================
  console.log('🏭 Creando proveedores...');
  const proveedores = [
    {
      nombre: 'Ferretería El Constructor',
      razonSocial: 'El Constructor S.A.',
      cuit: '20-12345678-9',
      domicilio: 'Av. Corrientes 1234, CABA',
      telefono: '011-4567-8901',
      email: 'contacto@elconstructor.com.ar',
      categoria: CategoriaProveedor.FERRETERIA,
      productosProvee: ['Herramientas manuales', 'Fijaciones', 'Materiales de construcción'],
      condicionesCompra: '30/60 días',
      formaPagoHabitual: FormaPagoHabitual.CUENTA_CORRIENTE,
      vendedorAsignado: 'Carlos López',
      activo: true,
      observaciones: 'Proveedor principal de herramientas',
    },
    {
      nombre: 'Distribuidora de Pinturas Color',
      razonSocial: 'Color S.R.L.',
      cuit: '27-23456789-0',
      domicilio: 'Av. Santa Fe 567, CABA',
      telefono: '011-5678-9012',
      email: 'ventas@colorpinturas.com.ar',
      categoria: CategoriaProveedor.PINTURAS,
      productosProvee: ['Pinturas', 'Bróchas', 'Rodillos', 'Diluyentes'],
      condicionesCompra: 'Contado o 15 días',
      formaPagoHabitual: FormaPagoHabitual.TRANSFERENCIA,
      vendedorAsignado: 'María García',
      activo: true,
      observaciones: 'Especialista en pinturas de calidad',
    },
    {
      nombre: 'Electricidad Total',
      razonSocial: 'Electricidad Total S.A.',
      cuit: '20-34567890-1',
      domicilio: 'Av. Rivadavia 890, CABA',
      telefono: '011-6789-0123',
      email: 'info@electricidadtotal.com.ar',
      categoria: CategoriaProveedor.ELECTRICIDAD,
      productosProvee: ['Cables', 'Interruptores', 'Lámparas', 'Accesorios eléctricos'],
      condicionesCompra: '30 días',
      formaPagoHabitual: FormaPagoHabitual.CUENTA_CORRIENTE,
      vendedorAsignado: 'Juan Pérez',
      activo: true,
      observaciones: 'Proveedor de materiales eléctricos',
    },
    {
      nombre: 'Plomería y Sanitarios San Martín',
      razonSocial: 'San Martín S.A.',
      cuit: '20-45678901-2',
      domicilio: 'Av. San Martín 234, CABA',
      telefono: '011-7890-1234',
      email: 'ventas@sanmartinplomeria.com.ar',
      categoria: CategoriaProveedor.PLOMERIA,
      productosProvee: ['Caños', 'Grifería', 'Sanitarios', 'Accesorios de plomería'],
      condicionesCompra: 'Efectivo o transferencia',
      formaPagoHabitual: FormaPagoHabitual.EFECTIVO,
      vendedorAsignado: 'Ana Rodríguez',
      activo: true,
      observaciones: 'Especialista en plomería',
    },
    {
      nombre: 'Materiales de Construcción La Roca',
      razonSocial: 'La Roca S.A.',
      cuit: '20-56789012-3',
      domicilio: 'Ruta 5 Km 45, La Plata',
      telefono: '0221-456-7890',
      email: 'compras@laroca.com.ar',
      categoria: CategoriaProveedor.CONSTRUCCION,
      productosProvee: ['Cemento', 'Ladrillos', 'Arena', 'Cal', 'Hierros'],
      condicionesCompra: '60 días',
      formaPagoHabitual: FormaPagoHabitual.CUENTA_CORRIENTE,
      vendedorAsignado: 'Carlos López',
      activo: true,
      observaciones: 'Mayorista de materiales de construcción',
    },
    {
      nombre: 'Herramientas Profesionales',
      razonSocial: 'Herramientas Profesionales S.R.L.',
      cuit: '27-67890123-4',
      domicilio: 'Av. Cabildo 1234, CABA',
      telefono: '011-8901-2345',
      email: 'info@herramientaspro.com.ar',
      categoria: CategoriaProveedor.HERRAMIENTAS,
      productosProvee: ['Herramientas eléctricas', 'Herramientas manuales', 'Equipos de seguridad'],
      condicionesCompra: '30 días',
      formaPagoHabitual: FormaPagoHabitual.CUENTA_CORRIENTE,
      vendedorAsignado: 'María García',
      activo: true,
      observaciones: 'Herramientas de alta calidad',
    },
    {
      nombre: 'Seguridad y Protección',
      razonSocial: 'Seguridad y Protección S.A.',
      cuit: '20-78901234-5',
      domicilio: 'Av. Libertador 567, CABA',
      telefono: '011-9012-3456',
      email: 'ventas@seguridadpro.com.ar',
      categoria: CategoriaProveedor.SEGURIDAD,
      productosProvee: ['Candados', 'Alarmas', 'Cámaras', 'Cercos eléctricos'],
      condicionesCompra: 'Contado',
      formaPagoHabitual: FormaPagoHabitual.MERCADOPAGO,
      vendedorAsignado: 'Juan Pérez',
      activo: true,
      observaciones: 'Equipos de seguridad',
    },
    {
      nombre: 'Jardinería y Exteriores',
      razonSocial: 'Jardinería y Exteriores S.R.L.',
      cuit: '27-89012345-6',
      domicilio: 'Av. del Libertador 890, CABA',
      telefono: '011-0123-4567',
      email: 'info@jardineriayexteriores.com.ar',
      categoria: CategoriaProveedor.JARDINERIA,
      productosProvee: ['Plantas', 'Fertilizantes', 'Herramientas de jardín', 'Mangueras'],
      condicionesCompra: '15 días',
      formaPagoHabitual: FormaPagoHabitual.TRANSFERENCIA,
      vendedorAsignado: 'Ana Rodríguez',
      activo: true,
      observaciones: 'Todo para jardín',
    },
    {
      nombre: 'Distribuidora General',
      razonSocial: 'Distribuidora General S.A.',
      cuit: '20-90123456-7',
      domicilio: 'Av. Córdoba 234, CABA',
      telefono: '011-1234-5678',
      email: 'compras@distribuidorageneral.com.ar',
      categoria: CategoriaProveedor.OTROS,
      productosProvee: ['Productos varios', 'Accesorios', 'Repuestos'],
      condicionesCompra: '30/60 días',
      formaPagoHabitual: FormaPagoHabitual.CHEQUE,
      vendedorAsignado: 'Carlos López',
      activo: true,
      observaciones: 'Distribuidora general con amplio catálogo',
    },
    {
      nombre: 'Ferretería del Barrio',
      razonSocial: 'Ferretería del Barrio S.R.L.',
      cuit: '27-01234567-8',
      domicilio: 'Av. Belgrano 456, CABA',
      telefono: '011-2345-6789',
      email: 'ventas@ferreteriadelbarrio.com.ar',
      categoria: CategoriaProveedor.FERRETERIA,
      productosProvee: ['Herramientas básicas', 'Fijaciones', 'Pinturas básicas'],
      condicionesCompra: 'Efectivo',
      formaPagoHabitual: FormaPagoHabitual.EFECTIVO,
      vendedorAsignado: 'María García',
      activo: false,
      observaciones: 'Proveedor inactivo - pendiente renovación de contrato',
    },
  ];

  let proveedoresCreados = 0;
  for (const proveedor of proveedores) {
    try {
      await createProveedorUseCase.execute(proveedor);
      proveedoresCreados++;
      console.log(`   ✅ ${proveedor.nombre}`);
    } catch (err: any) {
      console.error(`   ❌ Error con proveedor ${proveedor.nombre}: ${err.message}`);
    }
  }

  console.log(`✅ ${proveedoresCreados} proveedores creados\n`);

  // ============================================
  // 3. CONFIGURACIÓN DE VENTAS
  // ============================================
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - 1);
  fechaInicio.setDate(1);
  fechaInicio.setHours(0, 0, 0, 0);

  const diasMes = 30;
  const objetivoMensual = 20000000; // 20 millones ARS
  const objetivoDiario = 650000; // 650k por día
  const systemUserId = new Types.ObjectId().toString();

  console.log('💰 Configuración de ventas:');
  console.log(`   Objetivo mensual: $${objetivoMensual.toLocaleString('es-AR')}`);
  console.log(`   Objetivo diario: $${objetivoDiario.toLocaleString('es-AR')}`);
  console.log(`   Período: ${fechaInicio.toLocaleDateString('es-AR')} - ${new Date(fechaInicio.getTime() + (diasMes - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}\n`);

  // ============================================
  // 4. GENERAR VENTAS
  // ============================================
  console.log('🛒 Generando ventas...');
  let ventasCreadas = 0;
  let totalGenerado = 0;
  let totalEfectivo = 0;
  let totalAbdul = 0;
  let totalOsvaldo = 0;

  for (let dia = 0; dia < diasMes; dia++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fechaInicio.getDate() + dia);
    
    // Objetivo del día con variación realista (±10%)
    const variacion = (Math.random() * 0.2) - 0.1; // -10% a +10%
    const objetivoDia = objetivoDiario * (1 + variacion);
    
    let totalDia = 0;
    const ventasDelDia = Math.floor(Math.random() * 8) + 12; // 12-20 ventas por día

    for (let v = 0; v < ventasDelDia; v++) {
      try {
        const hora = Math.floor(Math.random() * 8) + 9; // 9-17
        const minuto = Math.floor(Math.random() * 60);
        fecha.setHours(hora, minuto, 0, 0);

        // Calcular monto restante para alcanzar objetivo del día
        const montoRestante = objetivoDia - totalDia;
        const ventasRestantes = ventasDelDia - v;
        const montoPromedio = ventasRestantes > 0 ? montoRestante / ventasRestantes : montoRestante;

        // Seleccionar productos
        const numProductos = Math.floor(Math.random() * 4) + 1; // 1-4 productos
        const productosSeleccionados = [];
        const productosDisponibles = [...productosData];

        for (let p = 0; p < numProductos && productosDisponibles.length > 0; p++) {
          const indice = Math.floor(Math.random() * productosDisponibles.length);
          const producto = productosDisponibles.splice(indice, 1)[0];
          
          if (!producto?.id || !Types.ObjectId.isValid(producto.id)) continue;
          
          const cantidad = Math.floor(Math.random() * 5) + 1;
          const descuento = Math.random() < 0.2 ? Math.floor(Math.random() * 10) : 0;

          productosSeleccionados.push({
            productoId: producto.id.toString(),
            cantidad,
            precioUnitario: producto.precioVenta,
            descuentoItem: descuento,
          });
        }

        if (productosSeleccionados.length === 0) continue;

        // Calcular subtotal y ajustar para alcanzar objetivo
        const subtotalBase = productosSeleccionados.reduce((sum, item) => 
          sum + (item.precioUnitario * item.cantidad), 0
        );

        // Ajustar precios proporcionalmente si es necesario
        if (subtotalBase > 0 && montoPromedio > 0) {
          const factor = Math.min(montoPromedio / subtotalBase, 3); // Máximo 3x para no exagerar
          productosSeleccionados.forEach(item => {
            item.precioUnitario = Math.round(item.precioUnitario * factor * 100) / 100;
          });
        }

        // Calcular total real
        const subtotalConDescuentos = productosSeleccionados.reduce((sum, item) => {
          const precioConDescuento = item.precioUnitario * (1 - item.descuentoItem / 100);
          return sum + (precioConDescuento * item.cantidad);
        }, 0);

        const totalVenta = Math.round(subtotalConDescuentos * 100) / 100;

        // Seleccionar método de pago (40% efectivo, 30% Abdul, 30% Osvaldo)
        const random = Math.random();
        let metodoPago;
        if (random < 0.4) {
          metodoPago = {
            tipo: TipoMetodoPago.EFECTIVO,
            monto: totalVenta,
          };
          totalEfectivo += totalVenta;
        } else if (random < 0.7) {
          metodoPago = {
            tipo: TipoMetodoPago.TRANSFERENCIA,
            monto: totalVenta,
            cuentaBancaria: CuentaBancaria.ABDUL,
            referencia: `TRF-ABDUL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
          totalAbdul += totalVenta;
        } else {
          metodoPago = {
            tipo: TipoMetodoPago.TRANSFERENCIA,
            monto: totalVenta,
            cuentaBancaria: CuentaBancaria.OSVALDO,
            referencia: `TRF-OSVALDO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
          totalOsvaldo += totalVenta;
        }

        const ventaData = {
          fecha: fecha.toISOString(),
          items: productosSeleccionados,
          metodosPago: [metodoPago],
          clienteNombre: `Cliente ${Math.floor(Math.random() * 200) + 1}`,
          tipoComprobante: Math.random() < 0.8 ? TipoComprobante.REMITO : TipoComprobante.FACTURA,
          descuentoGeneral: 0,
          observaciones: `Venta seed - Día ${dia + 1}`,
        };

        await createVentaUseCase.execute(ventaData, systemUserId);
        ventasCreadas++;
        totalGenerado += totalVenta;
        totalDia += totalVenta;
      } catch (err: any) {
        console.error(`❌ Error en venta: ${err.message}`);
      }
    }

    if ((dia + 1) % 5 === 0) {
      console.log(`   Día ${dia + 1}/${diasMes} - Total: $${totalGenerado.toLocaleString('es-AR')}`);
    }
  }

  console.log(`✅ Ventas creadas: ${ventasCreadas}`);
  console.log(`   Total: $${totalGenerado.toLocaleString('es-AR')}`);
  console.log(`   Efectivo: $${totalEfectivo.toLocaleString('es-AR')} (${((totalEfectivo/totalGenerado)*100).toFixed(1)}%)`);
  console.log(`   Abdul: $${totalAbdul.toLocaleString('es-AR')} (${((totalAbdul/totalGenerado)*100).toFixed(1)}%)`);
  console.log(`   Osvaldo: $${totalOsvaldo.toLocaleString('es-AR')} (${((totalOsvaldo/totalGenerado)*100).toFixed(1)}%)\n`);

  // ============================================
  // 5. GENERAR GASTOS DIARIOS
  // ============================================
  console.log('💸 Generando gastos diarios...');
  let gastosCreados = 0;
  let totalGastos = 0;

  const empleados = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez'];
  const categoriasGastos = [
    { categoria: CategoriaGasto.FLETE, probabilidad: 0.3, montoMin: 5000, montoMax: 25000 },
    { categoria: CategoriaGasto.SNACK, probabilidad: 0.2, montoMin: 2000, montoMax: 8000 },
    { categoria: CategoriaGasto.MANTENIMIENTO, probabilidad: 0.2, montoMin: 10000, montoMax: 50000 },
    { categoria: CategoriaGasto.LIMPIEZA, probabilidad: 0.1, montoMin: 3000, montoMax: 15000 },
    { categoria: CategoriaGasto.OTROS, probabilidad: 0.2, montoMin: 5000, montoMax: 30000 },
  ];

  const descripcionesGastos: Record<CategoriaGasto, string[]> = {
    [CategoriaGasto.FLETE]: ['Flete de mercadería', 'Transporte de materiales', 'Envío a cliente', 'Flete de proveedor'],
    [CategoriaGasto.SNACK]: ['Almuerzo del equipo', 'Café y bebidas', 'Snacks para empleados', 'Desayuno'],
    [CategoriaGasto.MANTENIMIENTO]: ['Reparación de herramientas', 'Mantenimiento de vehículo', 'Arreglo de instalaciones', 'Servicio técnico'],
    [CategoriaGasto.LIMPIEZA]: ['Productos de limpieza', 'Servicio de limpieza', 'Limpieza profunda'],
    [CategoriaGasto.OTROS]: ['Gastos varios', 'Materiales de oficina', 'Servicios varios'],
  };

  for (let dia = 0; dia < diasMes; dia++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fechaInicio.getDate() + dia);
    
    // 2-5 gastos por día
    const numGastos = Math.floor(Math.random() * 4) + 2;
    
    for (let g = 0; g < numGastos; g++) {
      try {
        const hora = Math.floor(Math.random() * 8) + 9;
        const minuto = Math.floor(Math.random() * 60);
        fecha.setHours(hora, minuto, 0, 0);

        // Seleccionar categoría según probabilidad
        const randomCat = Math.random();
        let categoriaSeleccionada = categoriasGastos[0].categoria;
        let acumulado = 0;
        for (const cat of categoriasGastos) {
          acumulado += cat.probabilidad;
          if (randomCat <= acumulado) {
            categoriaSeleccionada = cat.categoria;
            break;
          }
        }

        const catInfo = categoriasGastos.find(c => c.categoria === categoriaSeleccionada)!;
        const monto = Math.floor(Math.random() * (catInfo.montoMax - catInfo.montoMin + 1)) + catInfo.montoMin;
        const descripciones = descripcionesGastos[categoriaSeleccionada];
        const descripcion = descripciones[Math.floor(Math.random() * descripciones.length)];
        const empleado = empleados[Math.floor(Math.random() * empleados.length)];
        const metodoPago = Math.random() < 0.6 ? MetodoPagoGasto.EFECTIVO : MetodoPagoGasto.CAJA;

        const fechaGasto = new Date(fecha);
        fechaGasto.setHours(hora, minuto, 0, 0);
        
        await createGastoDiarioUseCase.execute({
          fecha: fechaGasto.toISOString().split('T')[0],
          categoria: categoriaSeleccionada,
          monto,
          descripcion,
          empleadoNombre: empleado,
          metodoPago,
        });

        gastosCreados++;
        totalGastos += monto;
      } catch (err: any) {
        console.error(`❌ Error en gasto: ${err.message}`);
      }
    }
  }

  console.log(`✅ Gastos creados: ${gastosCreados}`);
  console.log(`   Total: $${totalGastos.toLocaleString('es-AR')}\n`);

  // ============================================
  // 6. GENERAR RETIROS DE SOCIOS
  // ============================================
  console.log('💵 Generando retiros de socios...');
  let retirosCreados = 0;
  let totalRetirosAbdul = 0;
  let totalRetirosOsvaldo = 0;

  // Retiros semanales (cada 7 días aproximadamente)
  for (let semana = 0; semana < Math.floor(diasMes / 7); semana++) {
    const fechaRetiro = new Date(fechaInicio);
    fechaRetiro.setDate(fechaInicio.getDate() + (semana * 7) + 6); // Sábados
    fechaRetiro.setHours(18, 0, 0, 0);

    // Retiro de Abdul (400k-600k)
    const montoAbdul = Math.floor(Math.random() * 200001) + 400000;
    try {
      await createRetiroSocioUseCase.execute({
        fecha: fechaRetiro.toISOString().split('T')[0],
        cuentaBancaria: CuentaBancaria.ABDUL,
        monto: montoAbdul,
        descripcion: `Retiro semanal - Semana ${semana + 1}`,
        observaciones: 'Retiro semanal programado',
      });
      retirosCreados++;
      totalRetirosAbdul += montoAbdul;
    } catch (err: any) {
      console.error(`❌ Error en retiro Abdul: ${err.message}`);
    }

    // Retiro de Osvaldo (400k-600k)
    const montoOsvaldo = Math.floor(Math.random() * 200001) + 400000;
    try {
      await createRetiroSocioUseCase.execute({
        fecha: fechaRetiro.toISOString().split('T')[0],
        cuentaBancaria: CuentaBancaria.OSVALDO,
        monto: montoOsvaldo,
        descripcion: `Retiro semanal - Semana ${semana + 1}`,
        observaciones: 'Retiro semanal programado',
      });
      retirosCreados++;
      totalRetirosOsvaldo += montoOsvaldo;
    } catch (err: any) {
      console.error(`❌ Error en retiro Osvaldo: ${err.message}`);
    }
  }

  console.log(`✅ Retiros creados: ${retirosCreados}`);
  console.log(`   Abdul: $${totalRetirosAbdul.toLocaleString('es-AR')} (${Math.floor(retirosCreados/2)} retiros)`);
  console.log(`   Osvaldo: $${totalRetirosOsvaldo.toLocaleString('es-AR')} (${Math.floor(retirosCreados/2)} retiros)\n`);

  // ============================================
  // 7. RESUMEN FINAL
  // ============================================
  console.log('📊 RESUMEN FINAL:');
  console.log('='.repeat(60));
  console.log(`💰 Ingresos (Ventas): $${totalGenerado.toLocaleString('es-AR')}`);
  console.log(`   - Efectivo: $${totalEfectivo.toLocaleString('es-AR')}`);
  console.log(`   - Abdul: $${totalAbdul.toLocaleString('es-AR')}`);
  console.log(`   - Osvaldo: $${totalOsvaldo.toLocaleString('es-AR')}`);
  console.log(`💸 Gastos: $${totalGastos.toLocaleString('es-AR')}`);
  console.log(`💵 Retiros: $${(totalRetirosAbdul + totalRetirosOsvaldo).toLocaleString('es-AR')}`);
  console.log(`📈 Balance: $${(totalGenerado - totalGastos - totalRetirosAbdul - totalRetirosOsvaldo).toLocaleString('es-AR')}`);
  console.log(`📊 Margen: ${((totalGenerado - totalGastos) / totalGenerado * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  await app.close();
  console.log('\n✅ Seed completado exitosamente!');
}

bootstrap().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
