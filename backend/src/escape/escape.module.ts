import { Module } from '@nestjs/common';
import { EscapeGateway } from './escape.gateway';
import { EscapeService } from './escape.service';
import { BotEscapeService } from './bot-escape.service';
import { EscapeController } from './escape.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EscapeController],
  providers: [EscapeGateway, EscapeService, BotEscapeService],
  exports: [EscapeService]
})
export class EscapeModule {}
