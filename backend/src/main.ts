import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerOptions, swaggerTitle, swaggerDescription } from './common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All API routes are served under /api. The Angular frontend calls relative
  // `api/...` paths and the nginx sidecar proxies `/api/` → backend:3000/api/.
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:4200'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger Configuration --------------------------------
  // swaggerOptions, swaggerTitle, swaggerDescription variables are customized and defined in common/swagger/swagger.config.ts
  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI is mounted at /docs (NOT /api, which is now the global route prefix).
  SwaggerModule.setup('docs', app, document, swaggerOptions);

  // End Swagger Configurations --------------------------------

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`App running on Port ${port}`);
}
bootstrap();
