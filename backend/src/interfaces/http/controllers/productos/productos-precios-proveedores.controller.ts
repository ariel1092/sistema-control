import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetComparacionPreciosProveedorPorProductoUseCase } from '../../../../application/use-cases/precios/get-comparacion-precios-proveedor-por-producto.use-case';
import { GetComparacionPreciosProveedorPorProductoResponseDto } from '../../../../application/dtos/precios/get-comparacion-precios-proveedor-por-producto-response.dto';
import { GetPreciosProveedoresParamsDto, GetPreciosProveedoresQueryDto } from './get-precios-proveedores.dto';

@Controller('productos')
export class ProductosPreciosProveedoresController {
  constructor(
    private readonly getComparacionPreciosProveedorPorProductoUseCase: GetComparacionPreciosProveedorPorProductoUseCase,
  ) {}

  @Get(':productoId/precios-proveedores')
  async getComparacion(
    @Param() params: GetPreciosProveedoresParamsDto,
    @Query() _query: GetPreciosProveedoresQueryDto,
  ): Promise<GetComparacionPreciosProveedorPorProductoResponseDto> {
    return await this.getComparacionPreciosProveedorPorProductoUseCase.execute(params.productoId);
  }
}


