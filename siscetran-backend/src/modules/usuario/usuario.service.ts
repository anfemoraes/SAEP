import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll(busca?: string) {
    const where = busca
      ? {
          email: {
            contains: busca,
            mode: 'insensitive' as const,
          },
        }
      : {};

    return this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        email: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            matrizesCriadas: true,
            matrizesAvaliadas: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const { email, senha, role } = createUsuarioDto;

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email,
        senha: senhaHash,
        role: role || Role.USUARIO,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const data: any = {};

    if (updateUsuarioDto.email) {
      const emailExistente = await this.prisma.usuario.findUnique({
        where: { email: updateUsuarioDto.email },
      });

      if (emailExistente && emailExistente.id !== id) {
        throw new ConflictException('E-mail já está em uso');
      }

      data.email = updateUsuarioDto.email;
    }

    if (updateUsuarioDto.senha) {
      data.senha = await bcrypt.hash(updateUsuarioDto.senha, 10);
    }

    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return usuarioAtualizado;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!Object.values(Role).includes(updateRoleDto.role)) {
      throw new BadRequestException('Perfil inválido');
    }

    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        role: updateRoleDto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return usuarioAtualizado;
  }

  async remove(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário tem matrizes vinculadas
    const matrizes = await this.prisma.matriz.count({
      where: {
        OR: [{ criadoPorId: id }, { avaliadoPorId: id }],
      },
    });

    if (matrizes > 0) {
      throw new BadRequestException(
        'Não é possível remover usuário com matrizes vinculadas',
      );
    }

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { message: 'Usuário removido com sucesso' };
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }
}