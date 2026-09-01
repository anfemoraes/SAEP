import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
