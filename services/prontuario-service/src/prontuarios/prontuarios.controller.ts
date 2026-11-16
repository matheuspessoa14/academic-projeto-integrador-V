
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ProntuariosService } from './prontuarios.service.js';
import { CreateProntuarioDto } from './dto/create-prontuario.dto.js';

@Controller('prontuarios')
export class ProntuariosController {
  constructor(
    private readonly prontuariosService: ProntuariosService,
  ) {}

  @Get()
  listar() {
    return this.prontuariosService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.prontuariosService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CreateProntuarioDto) {
    return this.prontuariosService.criar(dto);
  }
}
