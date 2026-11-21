import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';

import {
  Req,
  ForbiddenException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { BloqueiosService } from './bloqueios.service.js';
import { CriarBloqueioDto } from './dto/criar-bloqueio.dto.js';

@ApiTags('Bloqueios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bloqueios')
export class BloqueiosController {
  constructor(
    private readonly bloqueiosService: BloqueiosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar bloqueios',
    description: 'Lista os bloqueios com filtro opcional por agenda.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bloqueios listados com sucesso.',
  })
  listar(
    @Req() request: AuthenticatedRequest,
    @Query('agendaId') agendaId?: string,
  ) {
    return this.bloqueiosService.listar(agendaId, request.user!.tenantId!);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar bloqueio por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Bloqueio encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Bloqueio não encontrado.',
  })
  buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bloqueiosService.buscarPorId(id, request.user!.tenantId!);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar bloqueio',
    description: 'Registra um bloqueio em uma agenda.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bloqueio criado com sucesso.',
  })
  @ApiResponse({
    status: 409,
    description: 'Existe conflito com outro bloqueio ou agendamento.',
  })
  criar(
    @Body() dto: CriarBloqueioDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user!.role === 'RECEPCAO') throw new ForbiddenException('Recepção não pode criar bloqueios.');
    return this.bloqueiosService.criar(dto, request.user!.tenantId!);
  }
}
