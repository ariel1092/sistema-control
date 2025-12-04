import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

// Inicializar Sentry ANTES de crear la app
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
    ],
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware de logging básico (debe ir primero)
  app.use((req: any, res: any, next: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // Configurar Sentry request handler
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  // Configurar prefijo global
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Configurar CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
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

  // Configurar Sentry error handler (debe ir después de los filtros)
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

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

  // Manejo de errores no capturados
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('❌ Unhandled Rejection:', reason);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(reason);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    process.exit(1);
  });

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación iniciada en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/${apiPrefix}/docs`);
  if (process.env.SENTRY_DSN) {
    console.log(`🔔 Sentry configurado para monitoreo de errores`);
  }
}

bootstrap();

