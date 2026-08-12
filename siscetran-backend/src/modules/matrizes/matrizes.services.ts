import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { CreateMatrizDto } from './dto/create-matriz.dto';
import { UpdateMatrizDto } from './dto/update-matriz.dto';
import { AvaliarMatrizDto } from './dto/avaliar-matriz.dto';
import { Status, Role } from '@prisma/client';

@Injectable()
export class MatrizesService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async findAll(status?: Status, userId?: string, role?: Role, usuarioId?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Se for usuário comum, só vê suas próprias matrizes
    if (role === Role.USUARIO) {
      where.criadoPorId = userId;
    }

    // Se for comitê ou admin, pode ver todas ou filtrar por usuário
    if (usuarioId && (role === Role.COMITE || role === Role.ADMIN)) {
      where.criadoPorId = usuarioId;
    }

    return this.prisma.matriz.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        avaliadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
      orderBy: {
        dataCriacao: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        avaliadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    // Usuário comum só vê suas próprias matrizes
    if (role === Role.USUARIO && matriz.criadoPorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para visualizar esta matriz');
    }

    return matriz;
  }

  async create(createMatrizDto: CreateMatrizDto, userId: string) {
    const { acoesIds, ...dados } = createMatrizDto;

    // Validar ações
    if (acoesIds && acoesIds.length > 0) {
      const acoesExistentes = await this.prisma.acao.findMany({
        where: {
          id: {
            in: acoesIds,
          },
        },
      });

      if (acoesExistentes.length !== acoesIds.length) {
        throw new BadRequestException('Uma ou mais ações não existem');
      }
    }

    const matriz = await this.prisma.matriz.create({
      data: {
        ...dados,
        criadoPorId: userId,
        acoes: acoesIds && acoesIds.length > 0
          ? {
              create: acoesIds.map((acaoId) => ({
                acaoId,
              })),
            }
          : undefined,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'CRIAR_MATRIZ',
      detalhes: `Criou a matriz ${matriz.id} - ${matriz.nome}`,
    });

    return matriz;
  }

  async update(id: string, updateMatrizDto: UpdateMatrizDto, userId: string, role: Role) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    // Verificar permissão
    if (role === Role.USUARIO && matriz.criadoPorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta matriz');
    }

    // Não pode editar matriz já enviada ou aprovada
    if (matriz.status === Status.ENVIADO || matriz.status === Status.APROVADO) {
      throw new BadRequestException('Matriz já enviada ou aprovada não pode ser editada');
    }

    const { acoesIds, ...dados } = updateMatrizDto;

    // Atualizar ações se fornecidas
    let acoesUpdate = undefined;
    if (acoesIds) {
      // Remover ações existentes
      await this.prisma.acoesMatriz.deleteMany({
        where: { matrizId: id },
      });

      // Adicionar novas ações
      acoesUpdate = {
        create: acoesIds.map((acaoId) => ({
          acaoId,
        })),
      };
    }

    const matrizAtualizada = await this.prisma.matriz.update({
      where: { id },
      data: {
        ...dados,
        acoes: acoesUpdate,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'ATUALIZAR_MATRIZ',
      detalhes: `Atualizou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome}`,
    });

    return matrizAtualizada;
  }

  async remove(id: string, userId: string, role: Role) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    // Verificar permissão
    if (role === Role.USUARIO && matriz.criadoPorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover esta matriz');
    }

    // Não pode remover matriz já enviada ou aprovada
    if (matriz.status === Status.ENVIADO || matriz.status === Status.APROVADO) {
      throw new BadRequestException('Matriz já enviada ou aprovada não pode ser removida');
    }

    // Remover ações vinculadas
    await this.prisma.acoesMatriz.deleteMany({
      where: { matrizId: id },
    });

    await this.prisma.matriz.delete({
      where: { id },
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'REMOVER_MATRIZ',
      detalhes: `Removeu a matriz ${matriz.id} - ${matriz.nome}`,
    });

    return { message: 'Matriz removida com sucesso' };
  }

  async enviarParaComite(id: string, userId: string) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (matriz.criadoPorId !== userId) {
      throw new ForbiddenException('Você só pode enviar suas próprias matrizes');
    }

    if (matriz.status === Status.ENVIADO) {
      throw new BadRequestException('Matriz já foi enviada');
    }

    if (matriz.status === Status.APROVADO) {
      throw new BadRequestException('Matriz já foi aprovada');
    }

    const matrizAtualizada = await this.prisma.matriz.update({
      where: { id },
      data: {
        status: Status.ENVIADO,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'ENVIAR_MATRIZ',
      detalhes: `Enviou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome} para o comitê`,
    });

    return matrizAtualizada;
  }

  async avaliar(id: string, avaliarMatrizDto: AvaliarMatrizDto, userId: string) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
    });

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
      include: {
        criadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        avaliadoPor: {
          select: {
            id: true,
            email: true,
          },
        },
        acoes: {
          include: {
            acao: true,
          },
        },
      },
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'AVALIAR_MATRIZ',
      detalhes: `Avaliou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome} como ${avaliarMatrizDto.status}`,
    });

    return matrizAtualizada;
  }
}