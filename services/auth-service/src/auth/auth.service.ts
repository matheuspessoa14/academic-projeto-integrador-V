
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service.js';
import { verificarSenha } from './password.utils.js';
import { LoginDto } from './dto/login.dto.js';

interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    // Busca o usuário pelo e-mail informado
    const usuario =
      await this.usersService.buscarPorEmailComSenha(
        dto.email,
      );

    // Verifica se o usuário existe e está ativo
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        'E-mail ou senha inválidos.',
      );
    }

    // Compara a senha digitada com o hash armazenado
    const senhaValida = await verificarSenha(
      dto.senha,
      usuario.senha,
    );

    if (!senhaValida) {
      throw new UnauthorizedException(
        'E-mail ou senha inválidos.',
      );
    }

    // Gera o token após autenticar as credenciais
    return this.gerarToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role ?? 'paciente',
    });
  }

  async gerarToken(usuario: UsuarioAutenticado) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
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
