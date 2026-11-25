import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';

import {
  Req,
  Controller,
  Get,
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

import { AgendasService } from './agendas.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Agendas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agendas')
export class AgendasController {
  constructor(
    private readonly agendasService: AgendasService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar agendas',
    description: 'Lista agendas com filtros opcionais por clínica e profissional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendas listadas com sucesso.',
  })
  listar(
    @Req() request: AuthenticatedRequest,
    @Query('clinicaId') clinicaId?: string,
    @Query('profissionalId') profissionalId?: string,
  ) {
    return this.agendasService.listar({
      clinicaId,
      profissionalId,
      tenantId: request.user!.tenantId!,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar agenda por ID',
    description: 'Retorna uma agenda incluindo suas disponibilidades e bloqueios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agenda encontrada.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agenda não encontrada.',
  })
  buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.agendasService.buscarPorId(id, request.user!.tenantId!);
  }
}
