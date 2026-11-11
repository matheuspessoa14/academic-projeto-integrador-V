
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ConflictException } from '@nestjs/common';

import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { verificarSenha } from '../auth/password.utils.js';

describe('UsersService - Cadastro de usuários', () => {
  let usersService: UsersService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    usersService = new UsersService(
      prismaMock as unknown as PrismaService,
    );
  });

  const novoUsuario = {
    nome: 'Matheus Teste',
    email: 'matheus@lumera.demo',
    senha: 'Lumera@12345',
  };

  it('deve cadastrar um usuário com sucesso', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockImplementation(
      async ({ data }) => ({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const resultado = await usersService.criar(novoUsuario);

    expect(resultado.id).toBe(1);
    expect(resultado.nome).toBe('Matheus Teste');
    expect(resultado.email).toBe('matheus@lumera.demo');
    expect(resultado.role).toBe('paciente');
    expect(resultado.ativo).toBe(true);
  });

  it('deve impedir cadastro com e-mail duplicado', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'matheus@lumera.demo',
    });

    await expect(
      usersService.criar(novoUsuario),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('deve proteger a senha durante o cadastro', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockImplementation(
      async ({ data }) => ({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const resultado = await usersService.criar(novoUsuario);

    const dadosSalvos =
      prismaMock.user.create.mock.calls[0][0].data;

    expect(dadosSalvos.senha).not.toBe(novoUsuario.senha);

    expect(
      await verificarSenha(
        novoUsuario.senha,
        dadosSalvos.senha,
      ),
    ).toBe(true);

    expect(resultado).not.toHaveProperty('senha');
  });
});
