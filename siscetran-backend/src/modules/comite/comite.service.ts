import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { AvaliarMatrizDto } from '../matrizes/dto/avaliar-matriz.dto';
import { VotarMatrizDto } from '../matrizes/dto/votar-matriz.dto';
import { Status } from '@prisma/client';

@Injectable()
export class ComiteService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  private readonly includeCompleto = {
    criadoPor: { select: { id: true, email: true, setor: true } },
    avaliadoPor: { select: { id: true, email: true } },
    acoes: { include: { acao: true } },
    votos: { include: { usuario: { select: { id: true, email: true, role: true } } } },
  };

  async getPendentes() {
    return this.prisma.matriz.findMany({
      where: { status: Status.ENVIADO },
      include: this.includeCompleto,
      orderBy: { dataCriacao: 'asc' },
    });
  }

  async getEstatisticas() {
    const total = await this.prisma.matriz.count();
    const enviados = await this.prisma.matriz.count({ where: { status: Status.ENVIADO } });
    const aprovados = await this.prisma.matriz.count({ where: { status: Status.APROVADO } });
    const pendentes = await this.prisma.matriz.count({ where: { status: Status.PENDENTE } });
    const rascunhos = await this.prisma.matriz.count({ where: { status: Status.RASCUNHO } });

    const resultado: Array<{ media_dias: number | null }> = await this.prisma.$queryRaw`
      SELECT
        AVG(EXTRACT(DAY FROM ("dataAvaliacao" - "dataCriacao"))) as media_dias
      FROM "Matriz"
      WHERE "dataAvaliacao" IS NOT NULL
    `;

    const mediaDias = resultado[0]?.media_dias || 0;

    return {
      total,
      enviados,
      aprovados,
      pendentes,
      rascunhos,
      mediaDiasAvaliacao: Math.round(Number(mediaDias)),
    };
  }

  async getMatrizes(status?: Status) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.matriz.findMany({
      where,
      include: this.includeCompleto,
      orderBy: { dataCriacao: 'desc' },
    });
  }

  async getMatriz(id: string) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
      include: this.includeCompleto,
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    return matriz;
  }

  /**
   * Registro de voto consultivo de um Conselheiro/Admin Geral.
   */
  async votar(id: string, votarMatrizDto: VotarMatrizDto, usuarioId: string) {
    const matriz = await this.prisma.matriz.findUnique({ where: { id } });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (matriz.status !== Status.ENVIADO) {
      throw new BadRequestException('Apenas matrizes enviadas podem receber votos');
    }

    const voto = await this.prisma.voto.upsert({
      where: {
        matrizId_usuarioId: { matrizId: id, usuarioId },
      },
      update: {
        voto: votarMatrizDto.voto,
        comentario: votarMatrizDto.comentario,
      },
      create: {
        matrizId: id,
        usuarioId,
        voto: votarMatrizDto.voto,
        comentario: votarMatrizDto.comentario,
      },
      include: {
        usuario: { select: { id: true, email: true, role: true } },
      },
    });

    await this.logsService.create({
      usuarioId,
      acao: 'VOTAR_MATRIZ',
      detalhes: `Votou "${votarMatrizDto.voto}" na matriz ${id}`,
    });

    return voto;
  }

  /**
   * Decisão final — restrita a Admin Geral pelo controller.
   */
  async avaliar(id: string, avaliarMatrizDto: AvaliarMatrizDto, userId: string) {
    const matriz = await this.prisma.matriz.findUnique({ where: { id } });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (matriz.status !== Status.ENVIADO) {
      throw new BadRequestException('Apenas matrizes enviadas podem ser avaliadas');
    }

    const matrizAtualizada = await this.prisma.matriz.update({
      where: { id },
      data: {
        status: avaliarMatrizDto.status,
        comentarioComite: avaliarMatrizDto.comentario,
        avaliadoPorId: userId,
        dataAvaliacao: new Date(),
      },
      include: this.includeCompleto,
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'AVALIAR_MATRIZ_COMITE',
      detalhes: `Matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome} avaliada como ${avaliarMatrizDto.status}`,
    });

    return matrizAtualizada;
  }
}
