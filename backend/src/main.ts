import 'dotenv/config'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || ''

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import pino from 'pino'
import pinoHttp from 'pino-http'
import { join } from 'path'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/exception.filter'
import { ResponseEnvelopeInterceptor } from './common/response.interceptor'
import { configuration } from './config/configuration'

async function bootstrapApp() {
  const config = configuration()

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const cookieSecret = config.jwt.accessSecret

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )
  app.use(
    pinoHttp(
      pino({
        level: config.logLevel,
        transport: config.isProd ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
      })
    )
  )
  app.use(cookieParser(cookieSecret))

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000']
      if (!origin || allowed.includes(origin)) return callback(null, true)
      return callback(null, true)
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  )

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())

  app.useStaticAssets(join(process.cwd(), config.uploads.dir), { prefix: '/uploads/' })

  if (!config.isTest) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LunchUp API')
      .setDescription('Food marketplace — modular monolith')
      .setVersion('1.0.0')
      .addCookieAuth('lunchup_access')
      .addBearerAuth()
      .addServer('/api/v1', 'API base (global prefix)')
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.init()
  return app
}

async function bootstrap() {
  const app = await bootstrapApp()
  const config = configuration()
  await app.listen(config.port, '0.0.0.0')
  Logger.log(`LunchUp API listening on http://localhost:${config.port}/api/v1`, 'Bootstrap')
}

if (require.main === module) {
  bootstrap()
}

export { bootstrapApp }