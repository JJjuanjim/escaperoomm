import { Module } from '@nestjs/common';
import { EscapeModule } from './escape/escape.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, EscapeModule, AuthModule]
})
export class AppModule {}
