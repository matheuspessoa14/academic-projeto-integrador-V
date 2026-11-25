
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

import { DisponibilidadesService } from './disponibilidades.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DisponibilidadesService', () => {
  const agendaId =
    '00000000-0000-4000-8000-000000000001';

  const unidadeId =
    '00000000-0000-4000-8000-000000000002';

  const servicoId =
    '00000000-0000-4000-8000-000000000003';

  const dto = {
    agendaId,
    unidadeId,
    servicoId,
    inicio: '2026-11-20T09:00:00',
    fim: '2026-11-20T12:00:00',
  };

  let service: DisponibilidadesService;
  let prisma: PrismaService;

  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    agenda: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    disponibilidade: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
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

      disponibilidade: {
        findFirst: vi.fn().mockResolvedValue(null),

        create: vi.fn().mockResolvedValue({
          id: 'disponibilidade-001',
          ...dto,
        }),
      },
    };

    const prismaMock = {
      disponibilidade: {
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

    service = new DisponibilidadesService(prisma);
  });

  describe('listar', () => {
    it('deve listar as disponibilidades', async () => {
      await service.listar({});

      expect(
        prisma.disponibilidade.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          inicio: 'asc',
        },
      });
    });

    it('deve filtrar disponibilidades', async () => {
      await service.listar({
        agendaId,
        unidadeId,
        servicoId,
      });

      expect(
        prisma.disponibilidade.findMany,
      ).toHaveBeenCalledWith({
        where: {
          agendaId,
          unidadeId,
          servicoId,
        },
        orderBy: {
          inicio: 'asc',
        },
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve rejeitar quando a disponibilidade não existir', async () => {
      await expect(
        service.buscarPorId('inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve retornar a disponibilidade encontrada', async () => {
      const disponibilidade = {
        id: 'disponibilidade-001',
        agendaId,
      };

      vi.mocked(prisma.disponibilidade.findUnique)
        .mockResolvedValue(disponibilidade as never);

      const resultado = await service.buscarPorId(
        'disponibilidade-001',
      );

      expect(resultado).toEqual(disponibilidade);
    });
  });

  describe('criar', () => {
    it('deve rejeitar datas inválidas', async () => {
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
          inicio: '2026-11-20T13:00:00',
          fim: '2026-11-20T12:00:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('não deve iniciar transação com período inválido', async () => {
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

      expect(
        tx.disponibilidade.create,
      ).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando a agenda estiver inativa', async () => {
      tx.agenda.findUnique.mockResolvedValue({
        id: agendaId,
        ativa: false,
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(
        tx.disponibilidade.create,
      ).not.toHaveBeenCalled();
    });

    it('deve rejeitar disponibilidades sobrepostas', async () => {
      tx.disponibilidade.findFirst.mockResolvedValue({
        id: 'disponibilidade-existente',
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(
        tx.disponibilidade.create,
      ).not.toHaveBeenCalled();
    });

    it('deve verificar conflito pela mesma agenda, unidade e serviço', async () => {
      await service.criar(dto);

      expect(
        tx.disponibilidade.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          agendaId,
          unidadeId,
          servicoId,
          inicio: {
            lt: new Date(dto.fim),
          },
          fim: {
            gt: new Date(dto.inicio),
          },
        },
      });
    });

    it('deve criar a disponibilidade quando não houver conflito', async () => {
      const resultado = await service.criar(dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);

      expect(
        tx.disponibilidade.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agendaId,
          unidadeId,
          servicoId,
          inicio: new Date(dto.inicio),
          fim: new Date(dto.fim),
        }),
      });

      expect(resultado).toEqual(
        expect.objectContaining({
          id: 'disponibilidade-001',
        }),
      );
    });
  });
});
