
import {
  NotFoundException,
} from '@nestjs/common';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AgendasService } from './agendas.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AgendasService', () => {
  const agendaId =
    '00000000-0000-4000-8000-000000000001';

  let service: AgendasService;
  let prisma: PrismaService;

  beforeEach(() => {
    vi.clearAllMocks();

    const prismaMock = {
      agenda: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    prisma = prismaMock as unknown as PrismaService;

    service = new AgendasService(prisma);
  });

  describe('listar', () => {
    it('deve listar todas as agendas', async () => {
      await service.listar({});

      expect(
        prisma.agenda.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          profissionalId: 'asc',
        },
      });
    });

    it('deve filtrar agendas por clínica', async () => {
      await service.listar({
        clinicaId: agendaId,
      });

      expect(
        prisma.agenda.findMany,
      ).toHaveBeenCalledWith({
        where: {
          clinicaId: agendaId,
        },
        orderBy: {
          profissionalId: 'asc',
        },
      });
    });

    it('deve filtrar agendas por profissional', async () => {
      const profissionalId =
        '00000000-0000-4000-8000-000000000002';

      await service.listar({
        profissionalId,
      });

      expect(
        prisma.agenda.findMany,
      ).toHaveBeenCalledWith({
        where: {
          profissionalId,
        },
        orderBy: {
          profissionalId: 'asc',
        },
      });
    });

    it('deve aplicar os dois filtros simultaneamente', async () => {
      const profissionalId =
        '00000000-0000-4000-8000-000000000002';

      await service.listar({
        clinicaId: agendaId,
        profissionalId,
      });

      expect(
        prisma.agenda.findMany,
      ).toHaveBeenCalledWith({
        where: {
          clinicaId: agendaId,
          profissionalId,
        },
        orderBy: {
          profissionalId: 'asc',
        },
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve rejeitar quando a agenda não existir', async () => {
      await expect(
        service.buscarPorId(agendaId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve retornar a agenda com disponibilidades e bloqueios', async () => {
      const agenda = {
        id: agendaId,
        clinicaId: 'clinica-001',
        profissionalId: 'profissional-001',
        ativa: true,
        disponibilidades: [],
        bloqueios: [],
      };

      vi.mocked(prisma.agenda.findUnique)
        .mockResolvedValue(agenda as never);

      const resultado =
        await service.buscarPorId(agendaId);

      expect(
        prisma.agenda.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: agendaId,
        },
        include: {
          disponibilidades: true,
          bloqueios: true,
        },
      });

      expect(resultado).toEqual(agenda);
    });
  });
});
