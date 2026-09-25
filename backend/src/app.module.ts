import { Module } from '@nestjs/common';
import { EscapeModule } from './escape/escape.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, EscapeModule]
})
export class AppModule {}
