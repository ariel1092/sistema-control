import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateVentaUseCase } from './create-venta.use-case';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { RegistrarVentaStockUseCase } from '../productos/registrar-venta-stock.use-case';
import { RegistrarMovimientoVentaUseCase } from './registrar-movimiento-venta.use-case';
import { RegistrarMovimientoCCVentaUseCase } from './registrar-movimiento-cc-venta.use-case';
import { RegistrarAuditoriaUseCase } from '../auditoria/registrar-auditoria.use-case';
import { RegistrarMovimientosCajaVentaUseCase } from '../caja/registrar-movimientos-caja-venta.use-case';
import { IConfiguracionRecargosRepository } from '../../ports/configuracion-recargos.repository.interface';
import { Connection } from 'mongoose';
import { Producto } from '../../../domain/entities/producto.entity';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../../../domain/enums/tipo-comprobante.enum';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';
import { CreateVentaDto } from '../../dtos/ventas/create-venta.dto';

describe('CreateVentaUseCase', () => {
  let useCase: CreateVentaUseCase;
  let ventaRepository: jest.Mocked<IVentaRepository>;
  let productoRepository: jest.Mocked<IProductoRepository>;
  let registrarVentaStockUseCase: jest.Mocked<RegistrarVentaStockUseCase>;
  let registrarMovimientoVentaUseCase: jest.Mocked<RegistrarMovimientoVentaUseCase>;
  let registrarMovimientoCCVentaUseCase: jest.Mocked<RegistrarMovimientoCCVentaUseCase>;
  let cacheManager: any;

  beforeEach(async () => {
    // Mock de repositorios
    const mockVentaRepository = {
      save: jest.fn(),
      findByNumero: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByVendedor: jest.fn(),
    };

    const mockProductoRepository = {
      findByIds: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockRegistrarVentaStockUseCase = {
      execute: jest.fn(),
      executeBatch: jest.fn(),
    };

    const mockRegistrarMovimientoVentaUseCase = {
      execute: jest.fn(),
    };

    const mockRegistrarMovimientoCCVentaUseCase = {
      ejecutarCargoPorVenta: jest.fn(),
    };

    const mockRegistrarAuditoriaUseCase = {
      execute: jest.fn(),
    };

    const mockRegistrarMovimientosCajaVentaUseCase = {
      registrarPorVenta: jest.fn(),
    };

    const mockConfiguracionRecargosRepository = {
      get: jest.fn().mockResolvedValue({ recargoDebitoPct: 0, recargoCreditoPct: 0 }),
    };

    const mockConnection = {
      startSession: jest.fn().mockResolvedValue({
        withTransaction: async (fn: any) => fn(),
        endSession: jest.fn(),
      }),
    } as unknown as Connection;

    const mockCacheManager = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVentaUseCase,
        {
          provide: 'IVentaRepository',
          useValue: mockVentaRepository,
        },
        {
          provide: 'IProductoRepository',
          useValue: mockProductoRepository,
        },
        {
          provide: RegistrarVentaStockUseCase,
          useValue: mockRegistrarVentaStockUseCase,
        },
        {
          provide: RegistrarMovimientoVentaUseCase,
          useValue: mockRegistrarMovimientoVentaUseCase,
        },
        {
          provide: RegistrarMovimientoCCVentaUseCase,
          useValue: mockRegistrarMovimientoCCVentaUseCase,
        },
        {
          provide: RegistrarAuditoriaUseCase,
          useValue: mockRegistrarAuditoriaUseCase,
        },
        {
          provide: RegistrarMovimientosCajaVentaUseCase,
          useValue: mockRegistrarMovimientosCajaVentaUseCase,
        },
        {
          provide: 'IConfiguracionRecargosRepository',
          useValue: mockConfiguracionRecargosRepository,
        },
        {
          provide: 'DatabaseConnection',
          useValue: mockConnection,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    useCase = module.get<CreateVentaUseCase>(CreateVentaUseCase);
    ventaRepository = module.get('IVentaRepository');
    productoRepository = module.get('IProductoRepository');
    registrarVentaStockUseCase = module.get(RegistrarVentaStockUseCase);
    registrarMovimientoVentaUseCase = module.get(RegistrarMovimientoVentaUseCase);
    registrarMovimientoCCVentaUseCase = module.get(RegistrarMovimientoCCVentaUseCase);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe crear una venta exitosamente con productos válidos', async () => {
      // Arrange
      const productoMock = Producto.crear({
        codigo: 'PROD-001',
        nombre: 'Producto Test',
        categoria: 'Test',
        unidadMedida: 'UN', // Campo requerido
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 10,
        stockMinimo: 2,
        activo: true,
      });
      // Asignar id usando Object.assign porque es readonly
      Object.assign(productoMock, { id: 'producto-id-1' });

      const createVentaDto: CreateVentaDto = {
        items: [
          {
            productoId: 'producto-id-1',
            cantidad: 2,
            precioUnitario: 150,
            descuentoItem: 0,
          },
        ],
        metodosPago: [
          {
            tipo: TipoMetodoPago.EFECTIVO,
            monto: 300,
          },
        ],
        tipoComprobante: TipoComprobante.REMITO,
        descuentoGeneral: 0,
        esCuentaCorriente: false,
      };

      const vendedorId = 'vendedor-id-1';

      // Mock de findByIds - retorna productos
      productoRepository.findByIds.mockResolvedValue([productoMock]);

      // Mock de findByNumero - no existe venta con ese número
      ventaRepository.findByNumero.mockResolvedValue(null);
      // Mock de duplicados
      (ventaRepository as any).findByVendedor.mockResolvedValue([]);

      // Mock de save - retorna venta guardada
      ventaRepository.save.mockImplementation(async (venta) => {
        Object.assign(venta, { id: 'venta-id-1' });
        return venta;
      });

      // Mock de registrar stock
      (registrarVentaStockUseCase as any).executeBatch.mockResolvedValue(undefined);

      // Mock de registrar movimiento
      registrarMovimientoVentaUseCase.execute.mockResolvedValue(undefined);

      // Mock de cache
      cacheManager.del.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(createVentaDto, vendedorId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('venta-id-1');
      expect(result.vendedorId).toBe(vendedorId);
      expect(result.detalles).toHaveLength(1);
      expect(result.detalles[0].cantidad).toBe(2);
      // Usar calcularTotal() en lugar de .total
      expect(result.calcularTotal()).toBe(300);

      // Verificar que se llamó a findByIds con los IDs correctos
      expect(productoRepository.findByIds).toHaveBeenCalledWith(
        ['producto-id-1'],
        expect.anything(),
      );

      // Verificar que se guardó la venta
      expect(ventaRepository.save).toHaveBeenCalledTimes(1);

      // Verificar que se descontó el stock
      expect((registrarVentaStockUseCase as any).executeBatch).toHaveBeenCalledWith(
        [{ productoId: 'producto-id-1', cantidad: 2 }],
        'venta-id-1',
        vendedorId,
        expect.anything(),
      );

      // Verificar que se invalidó el caché
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('debe fallar si no hay stock suficiente', async () => {
      // Arrange
      const productoMock = Producto.crear({
        codigo: 'PROD-001',
        nombre: 'Producto Test',
        categoria: 'Test',
        unidadMedida: 'UN',
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 1, // Solo 1 en stock
        stockMinimo: 2,
        activo: true,
      });
      Object.assign(productoMock, { id: 'producto-id-1' });

      const createVentaDto: CreateVentaDto = {
        items: [
          {
            productoId: 'producto-id-1',
            cantidad: 5, // Intentando vender 5
            precioUnitario: 150,
            descuentoItem: 0,
          },
        ],
        metodosPago: [
          {
            tipo: TipoMetodoPago.EFECTIVO,
            monto: 750,
          },
        ],
        tipoComprobante: TipoComprobante.REMITO,
        descuentoGeneral: 0,
        esCuentaCorriente: false,
      };

      const vendedorId = 'vendedor-id-1';

      productoRepository.findByIds.mockResolvedValue([productoMock]);

      // Act & Assert
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        VentaApplicationException,
      );
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        /stock insuficiente/i,
      );

      // Verificar que NO se guardó la venta
      expect(ventaRepository.save).not.toHaveBeenCalled();

      // Verificar que NO se descontó stock
      expect(registrarVentaStockUseCase.execute).not.toHaveBeenCalled();
    });

    it('debe fallar si el producto no existe', async () => {
      // Arrange
      const createVentaDto: CreateVentaDto = {
        items: [
          {
            productoId: 'producto-inexistente',
            cantidad: 2,
            precioUnitario: 150,
            descuentoItem: 0,
          },
        ],
        metodosPago: [
          {
            tipo: TipoMetodoPago.EFECTIVO,
            monto: 300,
          },
        ],
        tipoComprobante: TipoComprobante.REMITO,
        descuentoGeneral: 0,
        esCuentaCorriente: false,
      };

      const vendedorId = 'vendedor-id-1';

      // Mock - no encuentra el producto
      productoRepository.findByIds.mockResolvedValue([]);

      // Act & Assert
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        VentaApplicationException,
      );
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        /productos no fueron encontrados|algunos productos no fueron encontrados/i,
      );
    });

    it('debe validar que cuenta corriente requiere DNI del cliente', async () => {
      // Arrange
      const createVentaDto: CreateVentaDto = {
        items: [],
        metodosPago: [
          {
            tipo: TipoMetodoPago.CUENTA_CORRIENTE,
            monto: 300,
          },
        ],
        tipoComprobante: TipoComprobante.REMITO,
        descuentoGeneral: 0,
        esCuentaCorriente: true,
        // clienteDNI: undefined, // Falta el DNI
      };

      const vendedorId = 'vendedor-id-1';

      // Act & Assert
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        VentaApplicationException,
      );
      await expect(useCase.execute(createVentaDto, vendedorId)).rejects.toThrow(
        /DNI del cliente/,
      );
    });
  });
});
