
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import type {
  AuthenticatedRequest,
} from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuários do tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuários encontrados.',
  })
  @ApiResponse({
    status: 401,
    description: 'Autenticação obrigatória.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso exclusivo para administradores.',
  })
  async listar(
    @Req() request: AuthenticatedRequest,
  ) {
    await this.usersService.verificarAdministrador(
      request.user,
    );

    return this.usersService.listar();
  }

  // LUMERA_GESTAO_V2 - endpoint acessivel aos membros ativos do tenant.
  @Get('profissionais')
  async profissionais(@Req() request: AuthenticatedRequest) {
    await this.usersService.verificarMembro(request.user);
    return this.usersService.listarProfissionais();
  }

  @Patch(':id')
  async atualizar(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    await this.usersService.verificarAdministrador(request.user);
    return this.usersService.atualizar(id, dto, request.user!.sub);
  }

  @Post()
  @ApiOperation({
    summary: 'Cadastrar usuário da equipe',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Autenticação obrigatória.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso exclusivo para administradores.',
  })
  @ApiResponse({
    status: 409,
    description: 'E-mail já cadastrado.',
  })
  async criar(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ) {
    await this.usersService.verificarAdministrador(
      request.user,
    );

    return this.usersService.criar(dto);
  }
}
