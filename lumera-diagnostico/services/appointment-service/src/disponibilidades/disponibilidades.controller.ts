import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';

import {
  Req,
  ForbiddenException,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DisponibilidadesService } from './disponibilidades.service.js';
import { CriarDisponibilidadeDto } from './dto/criar-disponibilidade.dto.js';

@ApiTags('Disponibilidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disponibilidades')
export class DisponibilidadesController {
  constructor(
    private readonly disponibilidadesService: DisponibilidadesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar disponibilidades',
    description: 'Lista disponibilidades com filtros opcionais.',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidades listadas com sucesso.',
  })
  listar(
    @Req() request: AuthenticatedRequest,
    @Query('agendaId') agendaId?: string,
    @Query('unidadeId') unidadeId?: string,
    @Query('servicoId') servicoId?: string,
  ) {
    return this.disponibilidadesService.listar({
      agendaId,
      unidadeId,
      servicoId,
      tenantId: request.user!.tenantId!,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar disponibilidade por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidade encontrada.',
  })
  @ApiResponse({
    status: 404,
    description: 'Disponibilidade não encontrada.',
  })
  buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.disponibilidadesService.buscarPorId(id, request.user!.tenantId!);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar disponibilidade',
    description: 'Cadastra uma nova disponibilidade na agenda.',
  })
  @ApiResponse({
    status: 201,
    description: 'Disponibilidade criada com sucesso.',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma disponibilidade sobreposta.',
  })
  criar(
    @Body() dto: CriarDisponibilidadeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user!.role === 'RECEPCAO') throw new ForbiddenException('Recepção não pode criar disponibilidades.');
    return this.disponibilidadesService.criar(dto, request.user!.tenantId!);
  }
}
