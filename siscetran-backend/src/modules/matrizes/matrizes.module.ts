import { Module } from '@nestjs/common';
import { MatrizesController } from './matrizes.controller';
import { MatrizesService } from './matrizes.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [PrismaModule, LogsModule],
  controllers: [MatrizesController],
  providers: [MatrizesService],
  exports: [MatrizesService],
})
export class MatrizesModule {}
