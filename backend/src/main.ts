import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { RegisterUseCase } from './application/use-cases/auth/register.use-case';
import { Rol } from './domain/enums/rol.enum';

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

  // Configurar Helmet para seguridad HTTP (debe ir primero)
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    } : false, // Desactivar CSP en desarrollo para Swagger
    crossOriginEmbedderPolicy: false, // Necesario para Swagger
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Middleware de logging básico
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
    // Permite leer `Server-Timing` desde el browser (para correlación frontend)
    exposedHeaders: ['Server-Timing'],
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

  // Inicializar usuario administrador si no existe ningún usuario
  await initializeAdminUser(app);

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

async function initializeAdminUser(app: any) {
  try {
    const registerUseCase = app.get(RegisterUseCase);

    // Intentar crear el usuario administrador por defecto
    // Si ya existe, el RegisterUseCase lanzará un ConflictException que capturamos
    try {
      await registerUseCase.execute({
        nombre: 'Administrador',
        email: 'admin@ferreteria.com',
        password: 'admin123',
        rol: Rol.ADMIN,
      });

      console.log('✅ Usuario administrador creado exitosamente!');
      console.log('📋 Credenciales por defecto:');
      console.log('   Email: admin@ferreteria.com');
      console.log('   Contraseña: admin123');
      console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');
    } catch (error: any) {
      if (error.message?.includes('ya está registrado') || error.statusCode === 409) {
        console.log('ℹ️  El usuario administrador ya existe en la base de datos');
      } else {
        console.error('❌ Error al crear usuario administrador:', error.message);
      }
    }
  } catch (error: any) {
    console.error('⚠️  Error al inicializar usuario administrador:', error.message);
    // No detenemos la aplicación si falla la inicialización del admin
  }
}

bootstrap();

