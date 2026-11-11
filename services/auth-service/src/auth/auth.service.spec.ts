
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { gerarHashSenha } from './password.utils.js';

describe('AuthService - Autenticação', () => {
  const jwtService = new JwtService({
    secret: 'chave-exclusiva-para-testes-automatizados-123456',
    signOptions: {
      expiresIn: 3600,
    },
  });

  const usersMock = {
    buscarPorEmailComSenha: vi.fn(),
  };

  const authService = new AuthService(
    jwtService,
    usersMock as unknown as UsersService,
  );

  const usuarioTeste = {
    id: 1,
    nome: 'Usuário Teste',
    email: 'teste@lumera.demo',
    role: 'paciente',
  };

  let hashSenha: string;

  beforeAll(async () => {
    hashSenha = await gerarHashSenha('Lumera@12345');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar um token JWT válido', async () => {
    const resultado =
      await authService.gerarToken(usuarioTeste);

    expect(resultado.access_token).toBeDefined();
    expect(resultado.token_type).toBe('Bearer');
    expect(resultado.expires_in).toBe(3600);

    const payload = await jwtService.verifyAsync(
      resultado.access_token,
    );

    expect(payload.sub).toBe(1);
    expect(payload.email).toBe('teste@lumera.demo');
    expect(payload.role).toBe('paciente');
  });

  it('não deve incluir senha no retorno', async () => {
    const resultado =
      await authService.gerarToken(usuarioTeste);

    expect(resultado.usuario).not.toHaveProperty('senha');
    expect(resultado).not.toHaveProperty('senha');
  });

  it('deve rejeitar um token adulterado', async () => {
    const resultado =
      await authService.gerarToken(usuarioTeste);

    const tokenAdulterado =
      resultado.access_token + 'invalido';

    await expect(
      jwtService.verifyAsync(tokenAdulterado),
    ).rejects.toThrow();
  });

  it('deve permitir login com credenciais corretas', async () => {
    usersMock.buscarPorEmailComSenha.mockResolvedValue({
      ...usuarioTeste,
      senha: hashSenha,
      ativo: true,
    });

    const resultado = await authService.login({
      email: 'teste@lumera.demo',
      senha: 'Lumera@12345',
    });

    expect(resultado.access_token).toBeDefined();
    expect(resultado.usuario.email).toBe(
      'teste@lumera.demo',
    );
    expect(resultado.usuario).not.toHaveProperty('senha');
  });

  it('deve rejeitar senha incorreta', async () => {
    usersMock.buscarPorEmailComSenha.mockResolvedValue({
      ...usuarioTeste,
      senha: hashSenha,
      ativo: true,
    });

    await expect(
      authService.login({
        email: 'teste@lumera.demo',
        senha: 'SenhaErrada123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve rejeitar usuário desativado', async () => {
    usersMock.buscarPorEmailComSenha.mockResolvedValue({
      ...usuarioTeste,
      senha: hashSenha,
      ativo: false,
    });

    await expect(
      authService.login({
        email: 'teste@lumera.demo',
        senha: 'Lumera@12345',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve rejeitar usuário inexistente', async () => {
    usersMock.buscarPorEmailComSenha.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'inexistente@lumera.demo',
        senha: 'Lumera@12345',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
