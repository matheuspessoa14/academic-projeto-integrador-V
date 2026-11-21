import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { ConfigService } from '@nestjs/config';

describe('Usuarios: gestao administrativa e profissionais', () => {
  const tenantId = '00000000-0000-4000-8000-000000000001';
  const prisma = {
    user: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    perfil: { findUnique: vi.fn() },
  };
  const config = { getOrThrow: vi.fn(() => tenantId) };
  let service: UsersService;
  beforeEach(() => {
    vi.resetAllMocks();
    config.getOrThrow.mockReturnValue(tenantId);
    service = new UsersService(prisma as unknown as PrismaService, config as unknown as ConfigService);
  });

  it('lista somente profissionais ativos do tenant', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 4n, nome: 'Dra. Teste' }]);
    const result = await service.listarProfissionais();
    expect(result).toEqual([{ id: '4', nome: 'Dra. Teste' }]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId, ativo: true, perfil: { is: { codigo: 'PROFISSIONAL_SAUDE' } } },
    }));
  });

  it('nao revela dados a token de outra clinica', async () => {
    await expect(service.verificarMembro({sub:'1', email:'a@b.com', role:'ADMINISTRADOR', tenantId:'outro'}))
      .rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('impede desativar a propria conta administrativa', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1n, email: 'admin@lumera.demo', perfil: { codigo: 'ADMINISTRADOR' } });
    await expect(service.atualizar('1', { ativo: false }, '1')).rejects.toThrow(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('altera perfil de funcionario e retorna dados sem senha', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 2n, email: 'func@lumera.demo', perfil: { codigo: 'RECEPCAO' } });
    prisma.perfil.findUnique.mockResolvedValue({ id: 2, codigo: 'PROFISSIONAL_SAUDE' });
    prisma.user.update.mockResolvedValue({
      id: 2n, nome: 'Profissional Teste', email: 'func@lumera.demo', ativo: true,
      perfil: { codigo: 'PROFISSIONAL_SAUDE', nome: 'Profissional de Saude' },
    });
    const result = await service.atualizar('2', { role: 'PROFISSIONAL_SAUDE' }, '1');
    expect(result.role).toBe('PROFISSIONAL_SAUDE');
    expect(result).not.toHaveProperty('senhaHash');
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ perfilId: 2 }),
    }));
  });
});
