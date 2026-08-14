import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RecuperarSenhaDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;
}
