import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { getDatabaseConfig } from '../../infrastructure/config/database.config';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => getDatabaseConfig(),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}











