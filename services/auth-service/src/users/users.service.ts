
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { gerarHashSenha } from '../auth/password.utils.js';

import type {
  JwtPayload,
} from '../auth/guards/jwt-auth.guard.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getTenantId(): string {
    return this.config.getOrThrow<string>('TENANT_ID');
  }

  // Confirma as permissões atuais diretamente no banco.
  async verificarAdministrador(payload?: JwtPayload) {
    const tenantId = this.getTenantId();

    if (
      !payload ||
      payload.tenantId !== tenantId ||
      !/^[1-9]\d*$/.test(payload.sub)
    ) {
      throw new UnauthorizedException(
        'Sessão inválida.',
      );
    }

    const usuario = await this.prisma.user.findFirst({
      where: {
        id: BigInt(payload.sub),
        tenantId,
      },
      select: {
        ativo: true,
        perfil: {
          select: {
            codigo: true,
          },
        },
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        'Usuário inexistente ou inativo.',
      );
    }

    if (usuario.perfil.codigo !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar usuários.',
      );
    }
  }

  // Lista somente os usuários do tenant configurado.
  async listar() {
    const tenantId = this.getTenantId();

    const usuarios = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        perfil: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return usuarios.map((usuario) => ({
      id: usuario.id.toString(),
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.perfil.codigo,
      perfil: usuario.perfil.nome,
      ativo: usuario.ativo,
    }));
  }

  // Cadastro interno, chamado pela rota administrativa.
  async criar(dto: CreateUserDto) {
    const tenantId = this.getTenantId();
    const email = dto.email.trim().toLowerCase();
    const nome = dto.nome.trim();

    const existente = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existente) {
      throw new ConflictException(
        'Já existe um usuário com este e-mail.',
      );
    }

    // Novas contas recebem o perfil padrão RECEPCAO.
    const perfil = await this.prisma.perfil.findUnique({
      where: {
        codigo: 'RECEPCAO',
      },
    });

    if (!perfil) {
      throw new InternalServerErrorException(
        'Perfil padrão não encontrado.',
      );
    }

    const senhaHash = await gerarHashSenha(dto.senha);

    try {
      const usuario = await this.prisma.user.create({
        data: {
          tenantId,
          nome,
          email,
          senhaHash,
          perfilId: perfil.id,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          perfil: {
            select: {
              codigo: true,
              nome: true,
            },
          },
        },
      });

      // Nunca retorna a senha ou o hash.
      return {
        id: usuario.id.toString(),
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.perfil.codigo,
        perfil: usuario.perfil.nome,
        ativo: usuario.ativo,
      };
    } catch (error: unknown) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um usuário com este e-mail.',
        );
      }

      throw error;
    }
  }

  // Utilizado pelo AuthService durante o login.
  async buscarPorEmailComSenha(email: string) {
    const tenantId = this.getTenantId();

    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.trim().toLowerCase(),
        },
      },
      select: {
        id: true,
        tenantId: true,
        nome: true,
        email: true,
        senhaHash: true,
        ativo: true,
        perfil: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
    });
  }
}
