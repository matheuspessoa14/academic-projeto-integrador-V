
import { describe, expect, it } from 'vitest';
import {
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard.js';

import type {
  AuthenticatedRequest,
} from './jwt-auth.guard.js';

describe('JwtAuthGuard - Proteção de rotas', () => {
  const jwtService = new JwtService({
    secret: 'chave-exclusiva-para-testes-automatizados-123456',
  });

  const guard = new JwtAuthGuard(jwtService);

  function criarContexto(authorization?: string) {
    const request = {
      headers: {
        authorization,
      },
      user: undefined,
    } as unknown as AuthenticatedRequest;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  const payload = {
    sub: '1',
    email: 'teste@lumera.demo',
    role: 'ADMINISTRADOR',
    tenantId: '00000000-0000-4000-8000-000000000001',
  };

  it('deve permitir acesso com token válido', async () => {
    const token = await jwtService.signAsync(payload);

    const { context, request } = criarContexto(
      `Bearer ${token}`,
    );

    const resultado = await guard.canActivate(context);

    expect(resultado).toBe(true);
    expect(request.user?.sub).toBe('1');
    expect(request.user?.email).toBe('teste@lumera.demo');
    expect(request.user?.role).toBe('ADMINISTRADOR');
  });

  it('deve rejeitar requisição sem token', async () => {
    const { context } = criarContexto();

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve rejeitar token adulterado', async () => {
    const token = await jwtService.signAsync(payload);

    const { context } = criarContexto(
      `Bearer ${token}invalido`,
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve rejeitar token expirado', async () => {
    const token = await jwtService.signAsync(payload, {
      expiresIn: -10,
    });

    const { context } = criarContexto(
      `Bearer ${token}`,
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });
});
