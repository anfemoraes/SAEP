import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'novo@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ enum: Role, default: Role.USUARIO })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}