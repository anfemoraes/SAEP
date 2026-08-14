import { Module } from '@nestjs/common';
import { AcoesController } from './acoes.controller';
import { AcoesService } from './acoes.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [PrismaModule, LogsModule],
  controllers: [AcoesController],
  providers: [AcoesService],
  exports: [AcoesService],
})
export class AcoesModule {}
