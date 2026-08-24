import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiProperty({ example: 'novo@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'novasenha123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;
}