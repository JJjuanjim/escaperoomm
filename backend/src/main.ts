import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validación estricta global con DTOs y class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Escape Room Digital - API REST & WebSockets')
    .setDescription(
      'Sistema de Escape Room Cooperativo con NestJS 11 y Angular 22. ' +
      'Implementa Controladores, Servicios de Negocio, DTOs con validación estricta y Persistencia en PostgreSQL 18 vía Prisma ORM.',
    )
    .setVersion('1.0.0')
    .addTag('Escape Room Digital (API REST & Persistencia)')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const PORT = process.env.PORT || 3002;
  await app.listen(PORT, '0.0.0.0');

  console.log(`==============================================================================`);
  console.log(`🚀 [NestJS Escape Room Backend] Activo en: http://localhost:${PORT}`);
  console.log(`📖 [Swagger OpenAPI Docs] Disponible en: http://localhost:${PORT}/api/docs`);
  console.log(`📡 WebSocket Gateway listo para conexiones de clientes Angular y móviles`);
  console.log(`==============================================================================`);
}

bootstrap();

