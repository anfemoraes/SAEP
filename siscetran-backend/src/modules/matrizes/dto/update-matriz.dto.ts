import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Impacto } from '@prisma/client';

export class UpdateMatrizDto {
  @ApiProperty({ example: 'Modernização da Frota de Fiscalização' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 'Descrever a ação a ser executada' })
  @IsString()
  @IsOptional()
  oque?: string;

  @ApiProperty({ example: 'Justificativa da ação' })
  @IsString()
  @IsOptional()
  porque?: string;

  @ApiProperty({ example: 'Metodologia de execução' })
  @IsString()
  @IsOptional()
  como?: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsString()
  @IsOptional()
  quando?: string;

  @ApiProperty({ example: 'Belém, PA' })
  @IsString()
  @IsOptional()
  onde?: string;

  @ApiProperty({ example: 'R$ 1.500,00' })
  @IsString()
  @IsOptional()
  quanto?: string;

  @ApiProperty({ enum: Impacto })
  @IsEnum(Impacto)
  @IsOptional()
  impacto?: Impacto;

  @ApiProperty({ example: 'Observações adicionais' })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentual?: number;

  @ApiProperty({ example: ['AE 1.1.1.1', 'AE 1.1.1.2'] })
  @IsArray()
  @IsOptional()
  acoesIds?: string[];
}