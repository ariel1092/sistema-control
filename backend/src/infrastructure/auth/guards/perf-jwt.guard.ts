import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { performance } from 'perf_hooks';
import { addTime } from '../../performance/performance.storage';

/**
 * Guard de medición: valida JWT si está presente, pero no bloquea la request.
 * Objetivo: medir tiempo de auth sin cambiar el contrato actual.
 */
@Injectable()
export class PerfJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const start = performance.now();
    try {
      const req = context.switchToHttp().getRequest();
      const authHeader: string | undefined = req.headers?.authorization;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length);
        const secret =
          process.env.JWT_SECRET ||
          'your-secret-key-change-in-production';

        try {
          const payload = await this.jwtService.verifyAsync(token, { secret });
          req.user = payload;
        } catch (err) {
          // No cambiar comportamiento: si falla, continuar sin user.
          console.warn('JWT inválido (no bloquea request):', err?.message);
        }
      }

      return true;
    } finally {
      addTime('auth', performance.now() - start);
    }
  }
}

