import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { getDatabaseConfig } from '../../infrastructure/config/database.config';
import { mongoosePerformancePlugin } from '../../infrastructure/performance/mongoose-performance.plugin';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const config = getDatabaseConfig();
        return {
          ...config,
          connectionFactory: (connection: any) => {
            // Plugin global para medir tiempo de queries
            connection.plugin(mongoosePerformancePlugin);
            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}












