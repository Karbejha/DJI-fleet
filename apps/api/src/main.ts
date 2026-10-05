import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DJI-Fleet-API');
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow local development and standard frontend origins
      callback(null, true);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('DJI Drone Fleet & Flight Analytics Platform API')
    .setDescription(
      'Enterprise REST API for importing, analyzing, managing, and investigating DJI drone flight logs, telemetry tracks, and fleet hardware assets.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Imports')
    .addTag('Flights')
    .addTag('Fleet')
    .addTag('Analytics')
    .addTag('Exports & Reports')
    .addTag('GIS & Spatial Analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`DJI Fleet API server listening on http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
