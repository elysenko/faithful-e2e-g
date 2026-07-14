import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerOptions, swaggerTitle, swaggerDescription } from './common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import type { Request, Response, NextFunction } from 'express';

// Single-container packaging: this NestJS process serves the compiled Angular
// SPA alongside the REST API. The bundle is copied to ./client at image build
// time; override with CLIENT_DIST_PATH if needed.
const CLIENT_DIST_PATH =
  process.env.CLIENT_DIST_PATH || join(__dirname, '..', '..', 'client');

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // All API routes are served under /api. The Angular SPA calls relative
  // `api/...` paths; both are served by this same process on one port.
  app.setGlobalPrefix('api');

  // Serve the Angular static assets (main.js, styles.css, etc.) from the SPA build.
  app.useStaticAssets(CLIENT_DIST_PATH);

  // SPA fallback — registered as global middleware (BEFORE the Nest router) so it
  // runs after static-asset matching but ahead of the router's terminal 404. Any
  // non-API GET that isn't a real static file gets the SPA shell, letting Angular's
  // client-side router handle deep links (/login, /admin, /recipes/:id/edit, …).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return next();
    }
    // Express 5's res.sendFile only works via the { root } form here.
    res.sendFile('index.html', { root: CLIENT_DIST_PATH }, (err) => {
      if (err) next(err);
    });
  });

  const configService = app.get(ConfigService);
  // CSP is disabled: this process serves the Angular SPA, which injects component
  // styles as inline <style> tags at runtime — a strict default CSP would block
  // them and render the approved UI unstyled. Other helmet protections stay on.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: frontendUrl ?? true,
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

  // Container listens on 80 to match the k8s Service (targetPort 80) and the
  // ingress that routes /faithful-e2e-g/* → this pod.
  const port = process.env.PORT ?? 80;
  await app.listen(port);
  Logger.log(`App running on Port ${port}`);
}
bootstrap();
