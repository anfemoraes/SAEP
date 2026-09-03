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
import { VotarMatrizDto } from './dto/votar-matriz.dto';
import { Status, Role } from '@prisma/client';



interface UsuarioLogado {
  id: string;
  role: Role;
  setor?: string | null;
}

@Injectable()
export class MatrizesService {
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

  async findAll(status: Status | undefined, solicitante: UsuarioLogado, usuarioId?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // USUARIO: apenas as próprias.
    if (solicitante.role === Role.USUARIO) {
      where.criadoPorId = solicitante.id;
    }

    // ADMIN_SETOR: apenas as do próprio setor.
    if (solicitante.role === Role.ADMIN_SETOR) {
      where.criadoPor = { setor: solicitante.setor };
    }

    // COMITE e ADMIN_GERAL enxergam todas; filtro opcional por usuário criador.
    if (usuarioId && (solicitante.role === Role.COMITE || solicitante.role === Role.ADMIN_GERAL)) {
      where.criadoPorId = usuarioId;
    }

    return this.prisma.matriz.findMany({
      where,
      include: this.includeCompleto,
      orderBy: {
        dataCriacao: 'desc',
      },
    });
  }

  async findOne(id: string, solicitante: UsuarioLogado) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id },
      include: this.includeCompleto,
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (solicitante.role === Role.USUARIO && matriz.criadoPorId !== solicitante.id) {
      throw new ForbiddenException('Você não tem permissão para visualizar esta matriz');
    }

    if (
      solicitante.role === Role.ADMIN_SETOR &&
      matriz.criadoPor.setor !== solicitante.setor
    ) {
      throw new ForbiddenException('Você não tem permissão para visualizar esta matriz');
    }

    return matriz;
  }

    async create(createMatrizDto: CreateMatrizDto, userId: string) {
    const { acoes, ...dados } = createMatrizDto;

    if (acoes && acoes.length > 0) {
      const acoesIds = acoes.map((a) => a.acaoId);
      const acoesExistentes = await this.prisma.acao.findMany({
        where: { id: { in: acoesIds } },
      });

      if (acoesExistentes.length !== acoesIds.length) {
        throw new BadRequestException('Uma ou mais ações não existem');
      }
    }

    const matriz = await this.prisma.matriz.create({
      data: {
        ...dados,
        criadoPorId: userId,
        acoes:
          acoes && acoes.length > 0
            ? { create: acoes.map((a) => ({ acaoId: a.acaoId, etapas: a.etapas ?? [] })) }
            : undefined,
      },
      include: this.includeCompleto,
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'CRIAR_MATRIZ',
      detalhes: `Criou a matriz ${matriz.id} - ${matriz.nome}`,
    });

    return matriz;
  }

  private async verificarPermissaoEdicao(matrizId: string, solicitante: UsuarioLogado) {
    const matriz = await this.prisma.matriz.findUnique({
      where: { id: matrizId },
      include: { criadoPor: { select: { setor: true } } },
    });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (solicitante.role === Role.USUARIO && matriz.criadoPorId !== solicitante.id) {
      throw new ForbiddenException('Você não tem permissão para editar esta matriz');
    }

    if (
      solicitante.role === Role.ADMIN_SETOR &&
      matriz.criadoPor.setor !== solicitante.setor
    ) {
      throw new ForbiddenException('Você só pode editar matrizes do seu setor');
    }

    return matriz;
  }

  async update(id: string, updateMatrizDto: UpdateMatrizDto, solicitante: UsuarioLogado) {
    const matriz = await this.verificarPermissaoEdicao(id, solicitante);

    if (matriz.status === Status.ENVIADO || matriz.status === Status.APROVADO) {
      throw new BadRequestException('Matriz já enviada ou aprovada não pode ser editada');
    }

    const { acoes, ...dados } = updateMatrizDto;

    let acoesUpdate: { create: { acaoId: string; etapas: unknown }[] } | undefined = undefined;
    if (acoes) {
      await this.prisma.acoesMatriz.deleteMany({ where: { matrizId: id } });
      acoesUpdate = { create: acoes.map((a) => ({ acaoId: a.acaoId, etapas: a.etapas ?? [] })) };
    }

    const matrizAtualizada = await this.prisma.matriz.update({
      where: { id },
      data: { ...dados, acoes: acoesUpdate },
      include: this.includeCompleto,
    });

    await this.logsService.create({
      usuarioId: solicitante.id,
      acao: 'ATUALIZAR_MATRIZ',
      detalhes: `Atualizou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome}`,
    });

    return matrizAtualizada;
  }

  async remove(id: string, solicitante: UsuarioLogado) {
    const matriz = await this.verificarPermissaoEdicao(id, solicitante);

    if (matriz.status === Status.ENVIADO || matriz.status === Status.APROVADO) {
      throw new BadRequestException('Matriz já enviada ou aprovada não pode ser removida');
    }

    await this.prisma.acoesMatriz.deleteMany({ where: { matrizId: id } });
    await this.prisma.matriz.delete({ where: { id } });

    await this.logsService.create({
      usuarioId: solicitante.id,
      acao: 'REMOVER_MATRIZ',
      detalhes: `Removeu a matriz ${matriz.id} - ${matriz.nome}`,
    });

    return { message: 'Matriz removida com sucesso' };
  }

  async enviarParaComite(id: string, userId: string) {
    const matriz = await this.prisma.matriz.findUnique({ where: { id } });

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
      data: { status: Status.ENVIADO },
      include: this.includeCompleto,
    });

    await this.logsService.create({
      usuarioId: userId,
      acao: 'ENVIAR_MATRIZ',
      detalhes: `Enviou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome} para o comitê`,
    });

    return matrizAtualizada;
  }

  /**
   * Registro de voto de um Conselheiro (COMITE) ou Admin Geral.
   * Não decide o status da matriz — é apenas um registro consultivo,
   * visível para o Admin Geral na hora da decisão final.
   */
  async votar(id: string, votarMatrizDto: VotarMatrizDto, solicitante: UsuarioLogado) {
    const matriz = await this.prisma.matriz.findUnique({ where: { id } });

    if (!matriz) {
      throw new NotFoundException('Matriz não encontrada');
    }

    if (matriz.status !== Status.ENVIADO) {
      throw new BadRequestException('Apenas matrizes enviadas podem receber votos');
    }

    const voto = await this.prisma.voto.upsert({
      where: {
        matrizId_usuarioId: {
          matrizId: id,
          usuarioId: solicitante.id,
        },
      },
      update: {
        voto: votarMatrizDto.voto,
        comentario: votarMatrizDto.comentario,
      },
      create: {
        matrizId: id,
        usuarioId: solicitante.id,
        voto: votarMatrizDto.voto,
        comentario: votarMatrizDto.comentario,
      },
      include: {
        usuario: { select: { id: true, email: true, role: true } },
      },
    });

    await this.logsService.create({
      usuarioId: solicitante.id,
      acao: 'VOTAR_MATRIZ',
      detalhes: `Votou "${votarMatrizDto.voto}" na matriz ${id}`,
    });

    return voto;
  }

  /**
   * Decisão final — apenas Admin Geral. Define definitivamente o status
   * da matriz (APROVADO ou PENDENTE), independente da contagem de votos.
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
      acao: 'AVALIAR_MATRIZ',
      detalhes: `Avaliou a matriz ${matrizAtualizada.id} - ${matrizAtualizada.nome} como ${avaliarMatrizDto.status}`,
    });

    return matrizAtualizada;
  }
}