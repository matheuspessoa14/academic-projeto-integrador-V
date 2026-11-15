
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service.js';

import { UsersService } from './users.service.js';

describe('UsersService - Usuários e segurança', () => {
  const tenantId =
    '00000000-0000-4000-8000-000000000001';

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    perfil: {
      findUnique: vi.fn(),
    },
  };

  const configMock = {
    getOrThrow: vi.fn(),
  };

  let usersService: UsersService;

  const administrador = {
    sub: '1',
    email: 'admin@lumera.demo',
    role: 'ADMINISTRADOR',
    tenantId,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    configMock.getOrThrow.mockReturnValue(tenantId);

    usersService = new UsersService(
      prismaMock as unknown as PrismaService,
      configMock as unknown as ConfigService,
    );
  });

  it('deve buscar usuário pelo tenant e e-mail', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await usersService.buscarPorEmailComSenha(
      '  TESTE@LUMERA.DEMO  ',
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_email: {
            tenantId,
            email: 'teste@lumera.demo',
          },
        },
      }),
    );
  });

  it('deve consultar hash e perfil para autenticação', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await usersService.buscarPorEmailComSenha(
      'teste@lumera.demo',
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          senhaHash: true,
          ativo: true,
          perfil: {
            select: {
              codigo: true,
              nome: true,
            },
          },
        }),
      }),
    );
  });

  it('deve permitir administrador ativo', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      ativo: true,
      perfil: {
        codigo: 'ADMINISTRADOR',
      },
    });

    await expect(
      usersService.verificarAdministrador(administrador),
    ).resolves.toBeUndefined();

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 1n,
          tenantId,
        },
      }),
    );
  });

  it('deve bloquear usuário sem permissão', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      ativo: true,
      perfil: {
        codigo: 'RECEPCAO',
      },
    });

    await expect(
      usersService.verificarAdministrador(administrador),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve bloquear usuário inativo', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      ativo: false,
      perfil: {
        codigo: 'ADMINISTRADOR',
      },
    });

    await expect(
      usersService.verificarAdministrador(administrador),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve bloquear token de outro tenant', async () => {
    await expect(
      usersService.verificarAdministrador({
        ...administrador,
        tenantId: 'outro-tenant',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('deve listar usuários sem expor hash', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 1n,
        nome: 'Matheus Pessoa',
        email: 'matheus@lumera.demo',
        ativo: true,
        perfil: {
          codigo: 'ADMINISTRADOR',
          nome: 'Gestor / Administrador',
        },
      },
    ]);

    const resultado = await usersService.listar();

    expect(resultado).toEqual([
      {
        id: '1',
        nome: 'Matheus Pessoa',
        email: 'matheus@lumera.demo',
        role: 'ADMINISTRADOR',
        perfil: 'Gestor / Administrador',
        ativo: true,
      },
    ]);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId },
      }),
    );

    expect(resultado[0]).not.toHaveProperty('senhaHash');
  });

  it('deve rejeitar cadastro com e-mail duplicado', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1n,
    });

    await expect(
      usersService.criar({
        nome: 'Usuário Teste',
        email: 'teste@lumera.demo',
        senha: 'Lumera@12345',
      }),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('deve cadastrar usuário com perfil RECEPCAO', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.perfil.findUnique.mockResolvedValue({
      id: 3,
      codigo: 'RECEPCAO',
    });

    prismaMock.user.create.mockResolvedValue({
      id: 2n,
      nome: 'Usuário Teste',
      email: 'teste@lumera.demo',
      ativo: true,
      perfil: {
        codigo: 'RECEPCAO',
        nome: 'Recepção / Coordenação',
      },
    });

    const resultado = await usersService.criar({
      nome: 'Usuário Teste',
      email: 'TESTE@LUMERA.DEMO',
      senha: 'Lumera@12345',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          nome: 'Usuário Teste',
          email: 'teste@lumera.demo',
          perfilId: 3,
          ativo: true,
          senhaHash: expect.any(String),
        }),
      }),
    );

    expect(resultado.role).toBe('RECEPCAO');
    expect(resultado).not.toHaveProperty('senhaHash');
  });
});
