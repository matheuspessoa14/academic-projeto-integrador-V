import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite a comunicação com o frontend React
  app.enableCors({
    origin: ['http://localhost:5173'],
  });

  // Ativa a validação dos dados recebidos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lumera — Auth Service')
    .setDescription(
      'API de autenticação e cadastro de usuários do sistema Lumera — Gestão Clínica.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, swaggerDocument);

  // Inicia o servidor NestJS
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
