import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar prefijo global
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Configurar CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const corsOrigins = corsOrigin.split(',').map((origin) => origin.trim());
  
  app.enableCors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === '*' 
      ? true 
      : corsOrigins.includes('*') 
        ? true 
        : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar exception filter global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configurar logging interceptor global
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Módulo de Ventas - Ferretería')
    .setDescription('API REST para gestión de ventas de ferretería')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Ventas', 'Endpoints para gestión de ventas')
    .addTag('Productos', 'Endpoints para gestión de productos')
    .addTag('Caja', 'Endpoints para gestión de caja')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación iniciada en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();

