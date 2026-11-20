
import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AgendamentosService } from './agendamentos.service.js';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto.js';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agendamentos')
export class AgendamentosController {
  constructor(
    private readonly agendamentosService: AgendamentosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar agendamentos',
    description: 'Lista agendamentos com filtros opcionais.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos listados com sucesso.',
  })
  listar(
    @Query('pacienteId') pacienteId?: string,
    @Query('agendaId') agendaId?: string,
    @Query('status') status?: string,
  ) {
    return this.agendamentosService.listar({
      pacienteId,
      agendaId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar agendamento por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamento encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado.',
  })
  buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.agendamentosService.buscarPorId(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar agendamento',
    description: 'Cria um agendamento após validar a disponibilidade do horário.',
  })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado com sucesso.',
  })
  @ApiResponse({
    status: 409,
    description: 'Horário indisponível ou conflitante.',
  })
  criar(
    @Body() dto: CriarAgendamentoDto,
  ) {
    return this.agendamentosService.criar(dto);
  }

  @Patch(':id/cancelar')
  @ApiOperation({
    summary: 'Cancelar agendamento',
    description: 'Altera o status do agendamento para CANCELADO.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamento cancelado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Agendamento já cancelado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado.',
  })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.agendamentosService.cancelar(id);
  }
}
