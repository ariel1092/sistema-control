import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { performance } from 'perf_hooks';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  getStore,
  resetStore,
  runWithPerformanceStore,
} from '../../infrastructure/performance/performance.storage';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const res = context.switchToHttp().getResponse();

    const runner = getStore() ? (fn: () => Observable<any>) => fn() : runWithPerformanceStore;

    return runner(() => {
      const start = performance.now();

      return next.handle().pipe(
        finalize(() => {
          try {
            const store = getStore();
            const total = performance.now() - start;
            const auth = store?.auth ?? 0;
            const db = store?.db ?? 0;
            const logic = store?.logic ?? Math.max(total - db, 0);
            const external = store?.external ?? 0;

            const metrics = [
              `total;dur=${total.toFixed(2)}`,
              `auth;dur=${auth.toFixed(2)}`,
              `db;dur=${db.toFixed(2)}`,
              `logic;dur=${logic.toFixed(2)}`,
              `external;dur=${external.toFixed(2)}`,
            ].join(', ');

            res.setHeader('Server-Timing', metrics);
          } catch (err) {
            // No romper la respuesta si la métrica falla
            console.warn('PerformanceInterceptor error', err);
          } finally {
            resetStore();
          }
        }),
      );
    });
  }
}

