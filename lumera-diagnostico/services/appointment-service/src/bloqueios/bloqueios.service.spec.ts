
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { BloqueiosService } from './bloqueios.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('BloqueiosService', () => {
  const agendaId =
    '00000000-0000-4000-8000-000000000001';

  const dto = {
    agendaId,
    inicio: '2026-11-20T09:00:00',
    fim: '2026-11-20T10:00:00',
    motivo: 'Manutenção',
  };

  let service: BloqueiosService;
  let prisma: PrismaService;

  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    agenda: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    bloqueio: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    agendamento: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        { id: agendaId },
      ]),

      agenda: {
        findUnique: vi.fn().mockResolvedValue({
          id: agendaId,
          ativa: true,
        }),
      },

      bloqueio: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'bloqueio-001',
          ...dto,
        }),
      },

      agendamento: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const prismaMock = {
      bloqueio: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
      },

      $transaction: vi.fn(
        async (
          callback: (transaction: typeof tx) => Promise<unknown>,
        ) => callback(tx),
      ),
    };

    prisma = prismaMock as unknown as PrismaService;

    service = new BloqueiosService(prisma);
  });

  describe('listar', () => {
    it('deve listar os bloqueios', async () => {
      await service.listar();

      expect(
        prisma.bloqueio.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          inicio: 'asc',
        },
      });
    });

    it('deve filtrar bloqueios por agenda', async () => {
      await service.listar(agendaId);

      expect(
        prisma.bloqueio.findMany,
      ).toHaveBeenCalledWith({
        where: { agendaId },
        orderBy: {
          inicio: 'asc',
        },
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar erro quando o bloqueio não existir', async () => {
      await expect(
        service.buscarPorId('inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve retornar o bloqueio encontrado', async () => {
      const bloqueio = {
        id: 'bloqueio-001',
        agendaId,
      };

      vi.mocked(prisma.bloqueio.findUnique)
        .mockResolvedValue(bloqueio as never);

      const resultado =
        await service.buscarPorId('bloqueio-001');

      expect(resultado).toEqual(bloqueio);
    });
  });

  describe('criar', () => {
    it('deve rejeitar um período com datas inválidas', async () => {
      await expect(
        service.criar({
          ...dto,
          inicio: 'data-invalida',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve rejeitar quando o início for posterior ao fim', async () => {
      await expect(
        service.criar({
          ...dto,
          inicio: '2026-11-20T11:00:00',
          fim: '2026-11-20T10:00:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('não deve iniciar uma transação com período inválido', async () => {
      await expect(
        service.criar({
          ...dto,
          inicio: 'data-invalida',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando a agenda não existir', async () => {
      tx.$queryRaw.mockResolvedValue([]);

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.bloqueio.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando a agenda estiver inativa', async () => {
      tx.agenda.findUnique.mockResolvedValue({
        id: agendaId,
        ativa: false,
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.bloqueio.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando já existir um bloqueio no período', async () => {
      tx.bloqueio.findFirst.mockResolvedValue({
        id: 'bloqueio-existente',
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.agendamento.findFirst).not.toHaveBeenCalled();
      expect(tx.bloqueio.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando existir um agendamento no período', async () => {
      tx.agendamento.findFirst.mockResolvedValue({
        id: 'agendamento-existente',
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.bloqueio.create).not.toHaveBeenCalled();
    });

    it('deve criar o bloqueio quando todas as validações passarem', async () => {
      const resultado = await service.criar(dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);

      expect(tx.bloqueio.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agendaId,
          inicio: new Date(dto.inicio),
          fim: new Date(dto.fim),
          motivo: dto.motivo,
        }),
      });

      expect(resultado).toEqual(
        expect.objectContaining({
          id: 'bloqueio-001',
        }),
      );
    });
  });
});
