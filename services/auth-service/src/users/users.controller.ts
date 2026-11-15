
import {
  Body,
  Controller,
  Get,
  Post,
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
