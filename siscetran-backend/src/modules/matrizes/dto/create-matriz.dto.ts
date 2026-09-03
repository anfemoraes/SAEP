import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Impacto } from '@prisma/client';

export class AcaoEtapaDto {
  @ApiProperty({ example: 'AE 1.1.1.1' })
  @IsString()
  @IsNotEmpty()
  acaoId: string;

  @ApiProperty({ example: [{ titulo: 'Levantar requisitos', concluida: false }], required: false })
  @IsArray()
  @IsOptional()
  etapas?: unknown[];
}

export class CreateMatrizDto {
  @ApiProperty({ example: 'Modernização da Frota de Fiscalização' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Descrever a ação a ser executada' })
  @IsString()
  @IsNotEmpty()
  oque: string;

  @ApiProperty({ example: 'Justificativa da ação' })
  @IsString()
  @IsNotEmpty()
  porque: string;

  @ApiProperty({ example: 'Metodologia de execução' })
  @IsString()
  @IsNotEmpty()
  como: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsString()
  @IsNotEmpty()
  quando: string;

  @ApiProperty({ example: 'Belém, PA' })
  @IsString()
  @IsNotEmpty()
  onde: string;

  @ApiProperty({ example: 'R$ 1.500,00' })
  @IsString()
  @IsNotEmpty()
  quanto: string;

  @ApiProperty({ enum: Impacto, default: Impacto.MEDIO, required: false })
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

  @ApiProperty({ type: [AcaoEtapaDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AcaoEtapaDto)
  acoes?: AcaoEtapaDto[];
}