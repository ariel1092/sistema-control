import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      // Caché en memoria (para desarrollo y producción sin Redis)
      // En producción con Redis, usar: store: redisStore
      ttl: 300, // 5 minutos por defecto
      max: 1000, // Máximo 1000 items en caché
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

