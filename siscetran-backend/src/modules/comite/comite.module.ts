import { Module } from '@nestjs/common';
import { ComiteController } from './comite.controller';
import { ComiteService } from './comite.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [PrismaModule, LogsModule],
  controllers: [ComiteController],
  providers: [ComiteService],
  exports: [ComiteService],
})
export class ComiteModule {}
