import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateLogInput {
  usuarioId: string;
  acao: string;
  detalhes?: string;
  ip?: string;
}

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLogInput) {
    return this.prisma.log.create({ data });
  }

  async findAll() {
    return this.prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: { select: { id: true, email: true, role: true } },
      },
    });
  }
}
