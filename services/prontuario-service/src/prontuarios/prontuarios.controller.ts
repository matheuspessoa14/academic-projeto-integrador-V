
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProntuariosService } from './prontuarios.service.js';
import { CreateProntuarioDto } from './dto/create-prontuario.dto.js';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto.js';
import { ListarProntuariosDto } from './dto/listar-prontuarios.dto.js';

@Controller('prontuarios')
export class ProntuariosController {
  constructor(
    private readonly prontuariosService: ProntuariosService,
  ) {}

  @Get()
  listar(@Query() filtros: ListarProntuariosDto) {
    return this.prontuariosService.listar(filtros);
  }

  @Get('estatisticas')
  obterEstatisticas() {
    return this.prontuariosService.obterEstatisticas();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.prontuariosService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CreateProntuarioDto) {
    return this.prontuariosService.criar(dto);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProntuarioDto,
  ) {
    return this.prontuariosService.atualizar(id, dto);
  }
}
