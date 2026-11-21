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
  Logger.log(`API en http://localhost:${port}/api/v1 · Swagger en http://localhost:${port}/api/docs`, 'Bootstrap')
}

void main()
