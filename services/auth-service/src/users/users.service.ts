
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
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

  // LUMERA_GESTAO_V2: perfis e administracao de contas.
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

    // Sem perfil informado, novas contas recebem RECEPCAO.
    const perfil = await this.prisma.perfil.findUnique({
      where: {
        codigo: dto.role ?? 'RECEPCAO',
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

  // Qualquer usuario ativo do tenant pode consultar os profissionais da equipe.
  async verificarMembro(payload?: JwtPayload) {
    const tenantId = this.getTenantId();
    if (!payload || payload.tenantId !== tenantId || !/^[1-9]\d*$/.test(payload.sub)) {
      throw new UnauthorizedException('Sessao invalida.');
    }
    const usuario = await this.prisma.user.findFirst({
      where: { id: BigInt(payload.sub), tenantId, ativo: true },
      select: { id: true },
    });
    if (!usuario) throw new UnauthorizedException('Usuario inexistente ou inativo.');
  }

  async listarProfissionais() {
    const tenantId = this.getTenantId();
    const pessoas = await this.prisma.user.findMany({
      where: { tenantId, ativo: true, perfil: { is: { codigo: 'PROFISSIONAL_SAUDE' } } },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
    return pessoas.map(pessoa => ({ id: pessoa.id.toString(), nome: pessoa.nome }));
  }

  async atualizar(id: string, dto: UpdateUserDto, idAdministrador: string) {
    const tenantId = this.getTenantId();
    if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException('Identificador invalido.');
    if (Object.keys(dto).length === 0) throw new BadRequestException('Informe algum campo para editar.');

    const existente = await this.prisma.user.findFirst({
      where: { id: BigInt(id), tenantId },
      select: { id: true, email: true, perfil: { select: { codigo: true } } },
    });
    if (!existente) throw new NotFoundException('Usuario nao encontrado.');
    if (id === idAdministrador &&
       (dto.ativo === false || (dto.role !== undefined && dto.role !== 'ADMINISTRADOR'))) {
      throw new ForbiddenException('Voce nao pode desativar ou remover seu proprio perfil de administrador.');
    }
    const nome = dto.nome !== undefined ? dto.nome.trim() : undefined;
    const email = dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    if (nome !== undefined && nome.length < 3) throw new BadRequestException('Nome deve ter pelo menos 3 caracteres.');
    if (email !== undefined && email !== existente.email) {
      const duplicado = await this.prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email } },
        select: { id: true },
      });
      if (duplicado) throw new ConflictException('E-mail ja cadastrado.');
    }
    if (existente.perfil.codigo === 'ADMINISTRADOR' && dto.role && dto.role !== 'ADMINISTRADOR') {
      const outros = await this.prisma.user.count({
        where: { tenantId, ativo: true, perfil: { is: { codigo: 'ADMINISTRADOR' } } },
      });
      if (outros <= 1) throw new ForbiddenException('Nao e permitido remover o ultimo administrador.');
    }
    let perfilId: number | undefined;
    if (dto.role !== undefined) {
      const perfil = await this.prisma.perfil.findUnique({ where: { codigo: dto.role } });
      if (!perfil) throw new BadRequestException('Perfil solicitado nao encontrado.');
      perfilId = perfil.id;
    }
    try {
      const atualizado = await this.prisma.user.update({
        where: { id: BigInt(id) },
        data: { nome, email, ativo: dto.ativo, perfilId },
        select: {
          id: true, nome: true, email: true, ativo: true,
          perfil: { select: { codigo: true, nome: true } },
        },
      });
      return {
        id: atualizado.id.toString(), nome: atualizado.nome,
        email: atualizado.email, ativo: atualizado.ativo,
        role: atualizado.perfil.codigo, perfil: atualizado.perfil.nome,
      };
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        throw new ConflictException('E-mail ja cadastrado.');
      }
      throw e;
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
