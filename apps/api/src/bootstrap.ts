import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppConfig } from './shared/infrastructure/config/app-config.service'
import { DomainExceptionFilter } from './shared/presentation/domain-exception.filter'

export const API_PREFIX = 'api/v1'

/** Configuración HTTP común a `main.ts` y a las pruebas de integración. */
export function configureApp(app: INestApplication) {
  const config = app.get(AppConfig)

  // Detrás de nginx: la IP del cliente sale de X-Forwarded-For, solo si el proxy está en una red privada.
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback, uniquelocal')
  app.setGlobalPrefix(API_PREFIX)
  app.use(helmet())
  app.enableCors({ origin: config.corsOrigins, credentials: false })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.useGlobalFilters(new DomainExceptionFilter())
  app.enableShutdownHooks()

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Closer API')
      .setDescription(
        'API REST de Closer, simulador de llamadas de venta con IA. ' +
          'Autenticación: `Authorization: Bearer <access token de Supabase>`. ' +
          'En desarrollo se puede obtener un token con `POST /api/v1/auth/dev-token`.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  )
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs/openapi.json' })
  return document
}
