import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { Status } from '@prisma/client';

export class AvaliarMatrizDto {
  @ApiProperty({ enum: Status, enumName: 'Status' })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ example: 'Matriz aprovada com ressalvas...' })
  @IsString()
  @IsNotEmpty()
  comentario: string;
}
