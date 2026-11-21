import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureApp } from './bootstrap'
import { AppConfig } from './shared/infrastructure/config/app-config.service'

async function main() {
  const app = await NestFactory.create(AppModule)
  configureApp(app)
  const port = app.get(AppConfig).get('PORT')
  await app.listen(port)
  // Detrás de nginx (keepalive hacia las réplicas): Node debe mantener abiertas las conexiones inactivas MÁS
  // tiempo que nginx. Con el valor por defecto de Node (5 s), nginx reutilizaba conexiones que Node estaba
  // cerrando y devolvía 502 bajo carga (hallazgo de la prueba con k6).
  const server = app.getHttpServer()
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000
  Logger.log(`API en http://localhost:${port}/api/v1 · Swagger en http://localhost:${port}/api/docs`, 'Bootstrap')
}

void main()
