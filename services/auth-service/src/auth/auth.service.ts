
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service.js';
import { verificarSenha } from './password.utils.js';
import { LoginDto } from './dto/login.dto.js';

interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  role: string;
  tenantId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    const usuario =
      await this.usersService.buscarPorEmailComSenha(
        dto.email,
      );

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        'E-mail ou senha inválidos.',
      );
    }

    const senhaValida = await verificarSenha(
      dto.senha,
      usuario.senhaHash,
    );

    if (!senhaValida) {
      throw new UnauthorizedException(
        'E-mail ou senha inválidos.',
      );
    }

    return this.gerarToken({
      id: usuario.id.toString(),
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.perfil.codigo,
      tenantId: usuario.tenantId,
    });
  }

  async gerarToken(usuario: UsuarioAutenticado) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      ...(usuario.tenantId
        ? { tenantId: usuario.tenantId }
        : {}),
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }
}
