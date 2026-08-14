import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MatrizesService } from './matrizes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { Status } from '@prisma/client';

describe('MatrizesService', () => {
  let service: MatrizesService;
  let prisma: any;
  let logsService: { create: jest.Mock };

  const matrizMock = {
    id: 'matriz-1',
    nome: 'Modernização da Frota',
    status: Status.RASCUNHO,
    criadoPorId: 'user-1',
  };

  beforeEach(async () => {
    prisma = {
      matriz: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    logsService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatrizesService,
        { provide: PrismaService, useValue: prisma },
        { provide: LogsService, useValue: logsService },
      ],
    }).compile();

    service = module.get<MatrizesService>(MatrizesService);
  });

  describe('enviarParaComite', () => {
    it('deve impedir que outro usuário envie uma matriz que não é dele', async () => {
      prisma.matriz.findUnique.mockResolvedValue(matrizMock);

      await expect(
        service.enviarParaComite('matriz-1', 'outro-usuario'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve impedir reenvio de matriz já enviada', async () => {
      prisma.matriz.findUnique.mockResolvedValue({
        ...matrizMock,
        status: Status.ENVIADO,
      });

      await expect(
        service.enviarParaComite('matriz-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('avaliar', () => {
    it('deve impedir avaliação de matriz que não foi enviada', async () => {
      prisma.matriz.findUnique.mockResolvedValue({
        ...matrizMock,
        status: Status.RASCUNHO,
      });

      await expect(
        service.avaliar(
          'matriz-1',
          { status: Status.APROVADO, comentario: 'ok' },
          'comite-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
