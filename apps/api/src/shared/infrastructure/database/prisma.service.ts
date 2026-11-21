import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Cliente de PostgreSQL. El tamaño del pool se controla con `connection_limit` en DATABASE_URL,
 * así cada réplica del backend usa un número acotado de conexiones (escalabilidad de BD).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`
  }
}
