
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastrar um novo usuário',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de cadastro inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'E-mail já cadastrado.',
  })
  async register(@Body() dto: CreateUserDto) {
    return this.usersService.criar(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário e gerar token JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar a validade do token JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou ausente.',
  })
  verificarToken(@Req() request: AuthenticatedRequest) {
    return {
      autenticado: true,
      usuario: request.user,
    };
  }
}
