import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MatrizesService } from './matrizes.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, Status } from '@prisma/client';
import { CreateMatrizDto } from './dto/create-matriz.dto';
import { UpdateMatrizDto } from './dto/update-matriz.dto';
import { AvaliarMatrizDto } from './dto/avaliar-matriz.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('matrizes')
@ApiBearerAuth()
@Controller('matrizes')
@UseGuards(JwtGuard, RolesGuard)
export class MatrizesController {
  constructor(private readonly matrizesService: MatrizesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar matrizes' })
  @ApiResponse({ status: 200, description: 'Lista de matrizes retornada' })
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiQuery({ name: 'usuarioId', required: false })
  async findAll(
    @Query('status') status?: Status,
    @Query('usuarioId') usuarioId?: string,
    @Request() req?: any,
  ) {
    // Se for usuário comum, só vê suas próprias matrizes
    const userId = req?.user?.id;
    const role = req?.user?.role;

    return this.matrizesService.findAll(status, userId, role, usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar matriz por ID' })
  @ApiResponse({ status: 200, description: 'Matriz encontrada' })
  @ApiResponse({ status: 404, description: 'Matriz não encontrada' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.matrizesService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.USUARIO, Role.COMITE, Role.ADMIN)
  @ApiOperation({ summary: 'Criar nova matriz' })
  @ApiResponse({ status: 201, description: 'Matriz criada com sucesso' })
  async create(@Body() createMatrizDto: CreateMatrizDto, @Request() req: any) {
    return this.matrizesService.create(createMatrizDto, req.user.id);
  }

  @Put(':id')
  @Roles(Role.USUARIO, Role.COMITE, Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar matriz' })
  @ApiResponse({ status: 200, description: 'Matriz atualizada' })
  @ApiResponse({ status: 404, description: 'Matriz não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateMatrizDto: UpdateMatrizDto,
    @Request() req: any,
  ) {
    return this.matrizesService.update(id, updateMatrizDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.USUARIO, Role.COMITE, Role.ADMIN)
  @ApiOperation({ summary: 'Remover matriz' })
  @ApiResponse({ status: 204, description: 'Matriz removida' })
  @ApiResponse({ status: 404, description: 'Matriz não encontrada' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.matrizesService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/enviar')
  @Roles(Role.USUARIO, Role.COMITE, Role.ADMIN)
  @ApiOperation({ summary: 'Enviar matriz para comitê' })
  @ApiResponse({ status: 200, description: 'Matriz enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Matriz não pode ser enviada' })
  async enviar(@Param('id') id: string, @Request() req: any) {
    return this.matrizesService.enviarParaComite(id, req.user.id);
  }

  @Post(':id/avaliar')
  @Roles(Role.COMITE, Role.ADMIN)
  @ApiOperation({ summary: 'Avaliar matriz (comitê apenas)' })
  @ApiResponse({ status: 200, description: 'Matriz avaliada com sucesso' })
  @ApiResponse({ status: 404, description: 'Matriz não encontrada' })
  async avaliar(
    @Param('id') id: string,
    @Body() avaliarMatrizDto: AvaliarMatrizDto,
    @Request() req: any,
  ) {
    return this.matrizesService.avaliar(id, avaliarMatrizDto, req.user.id);
  }
}