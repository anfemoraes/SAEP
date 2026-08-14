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
  @ApiProperty({ example: 'Modernização da Frota de Fiscalização', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 'Descrever a ação a ser executada', required: false })
  @IsString()
  @IsOptional()
  oque?: string;

  @ApiProperty({ example: 'Justificativa da ação', required: false })
  @IsString()
  @IsOptional()
  porque?: string;

  @ApiProperty({ example: 'Metodologia de execução', required: false })
  @IsString()
  @IsOptional()
  como?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsString()
  @IsOptional()
  quando?: string;

  @ApiProperty({ example: 'Belém, PA', required: false })
  @IsString()
  @IsOptional()
  onde?: string;

  @ApiProperty({ example: 'R$ 1.500,00', required: false })
  @IsString()
  @IsOptional()
  quanto?: string;

  @ApiProperty({ enum: Impacto, required: false })
  @IsEnum(Impacto)
  @IsOptional()
  impacto?: Impacto;

  @ApiProperty({ example: 'Observações adicionais', required: false })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentual?: number;

  @ApiProperty({ example: ['AE 1.1.1.1', 'AE 1.1.1.2'], required: false })
  @IsArray()
  @IsOptional()
  acoesIds?: string[];
}
