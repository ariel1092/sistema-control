import { Injectable, NestMiddleware } from '@nestjs/common';
import { runWithPerformanceStore } from '../../infrastructure/performance/performance.storage';

@Injectable()
export class PerformanceContextMiddleware implements NestMiddleware {
  use(_req: any, _res: any, next: () => void): void {
    // Inicializa el contexto ALS por request para que Guards/Interceptors compartan métricas
    runWithPerformanceStore(() => next());
  }
}

