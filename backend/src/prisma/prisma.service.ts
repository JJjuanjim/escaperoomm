import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('==============================================================================');
      console.log('🔷 [Prisma ORM Escape Room] ✅ Conectado exitosamente a PostgreSQL (schema: escaperoom)');
      console.log('==============================================================================');
    } catch (err: any) {
      console.error('⚠️ [Prisma ORM] Error al conectar con PostgreSQL:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
