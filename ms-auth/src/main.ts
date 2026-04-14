import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Eureka } from 'eureka-js-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Microservice')
    .setDescription('Microservicio de Autenticación y Gestión de Usuarios')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3001);

  // Eureka Client Configuration
  const eurekaUrl = process.env.EUREKA_HOST || 'ms-eureka';
  const eurekaPort = parseInt(process.env.EUREKA_PORT || '8761', 10);
  
  const eureka = new Eureka({
    instance: {
      app: 'ms-auth',
      hostName: 'ms-auth',
      ipAddr: 'ms-auth',
      statusPageUrl: 'http://ms-auth:3001/api',
      port: {
        '$': 3001,
        '@enabled': true,
      },
      vipAddress: 'ms-auth',
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host: eurekaUrl,
      port: eurekaPort,
      servicePath: '/eureka/apps/',
    },
  });

  eureka.start((error) => {
    console.log(error || 'Eureka client started for ms-auth');
  });
}
bootstrap();
