
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

import { AgendamentosService } from './agendamentos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AgendamentosService', () => {
  const agendaId =
    '00000000-0000-4000-8000-000000000001';

  const dto = {
    agendaId,
    pacienteId: '00000000-0000-4000-8000-000000000002',
    unidadeId: '00000000-0000-4000-8000-000000000003',
    servicoId: '00000000-0000-4000-8000-000000000004',
    inicio: '2026-11-20T09:00:00',
    fim: '2026-11-20T10:00:00',
  };

  let service: AgendamentosService;
  let prisma: PrismaService;

  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    agenda: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    disponibilidade: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    bloqueio: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    agendamento: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
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
        findFirst: vi.fn().mockResolvedValue({
          id: 'disponibilidade-001',
        }),
      },

      bloqueio: {
        findFirst: vi.fn().mockResolvedValue(null),
      },

      agendamento: {
        findFirst: vi.fn().mockResolvedValue(null),

        findUnique: vi.fn().mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'AGENDADO',
        }),

        create: vi.fn().mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'AGENDADO',
        }),

        update: vi.fn().mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'CANCELADO',
        }),
      },
    };

    const prismaMock = {
      agendamento: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },

      $transaction: vi.fn(
        async (
          callback: (transaction: typeof tx) => Promise<unknown>,
        ) => callback(tx),
      ),
    };

    prisma = prismaMock as unknown as PrismaService;

    service = new AgendamentosService(prisma);
  });

  describe('listar', () => {
    it('deve listar os agendamentos', async () => {
      await service.listar({});

      expect(prisma.agendamento.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          inicio: 'asc',
        },
      });
    });

    it('deve aplicar filtros de pesquisa', async () => {
      await service.listar({
        pacienteId: dto.pacienteId,
        agendaId,
        status: 'AGENDADO',
      });

      expect(prisma.agendamento.findMany).toHaveBeenCalledWith({
        where: {
          pacienteId: dto.pacienteId,
          agendaId,
          status: 'AGENDADO',
        },
        orderBy: {
          inicio: 'asc',
        },
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar erro quando o agendamento não existir', async () => {
      await expect(
        service.buscarPorId('inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve retornar o agendamento encontrado', async () => {
      const agendamento = {
        id: 'agendamento-001',
        status: 'AGENDADO',
      };

      vi.mocked(prisma.agendamento.findUnique)
        .mockResolvedValue(agendamento as never);

      const resultado = await service.buscarPorId(
        'agendamento-001',
      );

      expect(resultado).toEqual(agendamento);
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
          inicio: '2026-11-20T11:00:00',
          fim: '2026-11-20T10:00:00',
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

      expect(tx.agendamento.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando a agenda estiver inativa', async () => {
      tx.agenda.findUnique.mockResolvedValue({
        id: agendaId,
        ativa: false,
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.agendamento.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando não existir disponibilidade', async () => {
      tx.disponibilidade.findFirst.mockResolvedValue(null);

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.agendamento.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando o horário estiver bloqueado', async () => {
      tx.bloqueio.findFirst.mockResolvedValue({
        id: 'bloqueio-001',
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.agendamento.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando já existir outro agendamento', async () => {
      tx.agendamento.findFirst.mockResolvedValue({
        id: 'agendamento-existente',
      });

      await expect(
        service.criar(dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.agendamento.create).not.toHaveBeenCalled();
    });

    it('deve criar o agendamento quando todas as validações passarem', async () => {
      const resultado = await service.criar(dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);

      expect(tx.disponibilidade.findFirst).toHaveBeenCalled();
      expect(tx.bloqueio.findFirst).toHaveBeenCalled();
      expect(tx.agendamento.findFirst).toHaveBeenCalled();

      expect(tx.agendamento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agendaId,
          pacienteId: dto.pacienteId,
          unidadeId: dto.unidadeId,
          servicoId: dto.servicoId,
          inicio: new Date(dto.inicio),
          fim: new Date(dto.fim),
          status: 'AGENDADO',
        }),
      });

      expect(resultado).toEqual(
        expect.objectContaining({
          id: 'agendamento-001',
        }),
      );
    });
  });

  describe('cancelar', () => {
    it('deve rejeitar quando o agendamento não existir', async () => {
      await expect(
        service.cancelar('inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve rejeitar quando a agenda não existir', async () => {
      vi.mocked(prisma.agendamento.findUnique)
        .mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'AGENDADO',
        } as never);

      tx.$queryRaw.mockResolvedValue([]);

      await expect(
        service.cancelar('agendamento-001'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.agendamento.update).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando o agendamento já estiver cancelado', async () => {
      vi.mocked(prisma.agendamento.findUnique)
        .mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'AGENDADO',
        } as never);

      tx.agendamento.findUnique.mockResolvedValue({
        id: 'agendamento-001',
        agendaId,
        status: 'CANCELADO',
      });

      await expect(
        service.cancelar('agendamento-001'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tx.agendamento.update).not.toHaveBeenCalled();
    });

    it('deve cancelar o agendamento dentro de uma transação', async () => {
      vi.mocked(prisma.agendamento.findUnique)
        .mockResolvedValue({
          id: 'agendamento-001',
          agendaId,
          status: 'AGENDADO',
        } as never);

      const resultado = await service.cancelar(
        'agendamento-001',
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);

      expect(tx.agendamento.update).toHaveBeenCalledWith({
        where: {
          id: 'agendamento-001',
        },
        data: {
          status: 'CANCELADO',
        },
      });

      expect(resultado.status).toBe('CANCELADO');
    });
  });
});
