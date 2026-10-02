import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';


function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app    = await NestFactory.create(AppModule);


  const isProd         = process.env.NODE_ENV === 'production';
  const configured     = parseOrigins(process.env.CORS_ORIGIN);
  const devOrigins     = ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'];


  if (isProd && configured.length === 0) {
    throw new Error(
      'CORS_ORIGIN is not set. Set it to the deployed frontend origin(s), comma-separated.',
    );
  }


  const allowedOrigins = configured.length > 0 ? configured : devOrigins;
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);


  app.enableCors({
    origin: (origin, callback) => {
      // No Origin header: mobile app, RFID device, server-to-server, curl.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );


  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend API running on http://0.0.0.0:${port}`);
}


void bootstrap();