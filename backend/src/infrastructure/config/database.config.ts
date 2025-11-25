import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (): MongooseModuleOptions => {
  // Si MONGODB_URI está definida, usarla directamente
  let mongodbUri = process.env.MONGODB_URI;
  
  // Si no está definida, construir la URI con credenciales por defecto
  if (!mongodbUri) {
    const mongodbUser = process.env.MONGODB_USER || 'admin';
    const mongodbPassword = process.env.MONGODB_PASSWORD || 'admin123';
    const mongodbHost = process.env.MONGODB_HOST || 'localhost';
    const mongodbPort = process.env.MONGODB_PORT || '27017';
    const mongodbDbName = process.env.MONGODB_DB_NAME || 'ventas-ferreteria';
    const mongodbAuthSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
    
    // Para desarrollo: intentar sin autenticación primero, luego con autenticación
    const useAuth = process.env.MONGODB_USE_AUTH === 'true';
    
    if (useAuth) {
      mongodbUri = `mongodb://${mongodbUser}:${mongodbPassword}@${mongodbHost}:${mongodbPort}/${mongodbDbName}?authSource=${mongodbAuthSource}`;
    } else {
      // Sin autenticación para desarrollo local
      mongodbUri = `mongodb://${mongodbHost}:${mongodbPort}/${mongodbDbName}`;
    }
  }

  const mongodbDbName = process.env.MONGODB_DB_NAME || 'ventas-ferreteria';

  console.log('🔌 Conectando a MongoDB:', mongodbUri.replace(/\/\/.*:.*@/, '//***:***@')); // Ocultar credenciales en logs

  return {
    uri: mongodbUri,
    ...(mongodbDbName && { dbName: mongodbDbName }),
    retryWrites: true,
    w: 'majority',
  };
};

