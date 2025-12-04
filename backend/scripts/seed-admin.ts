import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { RegisterUseCase } from '../src/application/use-cases/auth/register.use-case';
import { Rol } from '../src/domain/enums/rol.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const registerUseCase = app.get(RegisterUseCase);

  console.log('🔐 Creando usuario administrador...\n');

  try {
    const admin = await registerUseCase.execute({
      nombre: 'Administrador',
      email: 'admin@ferreteria.com',
      password: 'admin123',
      rol: Rol.ADMIN,
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('\n📋 Credenciales:');
    console.log('   Email: admin@ferreteria.com');
    console.log('   Contraseña: admin123');
    console.log(`\n👤 Usuario ID: ${admin.user.id}`);
    console.log(`   Nombre: ${admin.user.nombre}`);
    console.log(`   Rol: ${admin.user.rol}`);
  } catch (error: any) {
    if (error.message?.includes('ya está registrado')) {
      console.log('⚠️  El usuario administrador ya existe en la base de datos.');
      console.log('\n📋 Credenciales:');
      console.log('   Email: admin@ferreteria.com');
      console.log('   Contraseña: admin123');
    } else {
      console.error('❌ Error al crear usuario administrador:', error.message);
    }
  }

  await app.close();
}

bootstrap();


