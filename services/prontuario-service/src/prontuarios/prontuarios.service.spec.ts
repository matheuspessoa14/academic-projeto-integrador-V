
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ProntuariosService } from './prontuarios.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('ProntuariosService', () => {
  // Simula os metodos do Prisma utilizados nos testes.
  const prismaMock = {
    prontuario: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  let service: ProntuariosService;

  beforeEach(() => {
    // Limpa os resultados das simulacoes anteriores.
    vi.resetAllMocks();

    // Instancia o Service com o Prisma simulado.
    service = new ProntuariosService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('buscarPorId', () => {
    it('deve retornar um prontuario existente', async () => {
      const prontuario = {
        id: 1,
        paciente: 'Maria Silva',
        medico: 'Dr. Carlos',
      };

      prismaMock.prontuario.findUnique.mockResolvedValue(
        prontuario,
      );

      const resultado = await service.buscarPorId(1);

      expect(resultado).toEqual(prontuario);

      expect(
        prismaMock.prontuario.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve retornar erro quando o prontuario nao existir', async () => {
      prismaMock.prontuario.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.buscarPorId(999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('criar', () => {
    it('deve preparar os dados corretamente para o Prisma', async () => {
      const dto = {
        paciente: '  Maria Silva  ',
        medico: '  Dr. Carlos  ',
        data: '2026-11-18',
        tipo: '  Consulta de rotina  ',
        observacoes: '  Atendimento ficticio  ',
      };

      const prontuarioCriado = {
        id: 1,
        paciente: 'Maria Silva',
        medico: 'Dr. Carlos',
        data: new Date('2026-11-18T00:00:00.000Z'),
        tipo: 'Consulta de rotina',
        observacoes: 'Atendimento ficticio',
        status: 'EM_ANALISE',
      };

      prismaMock.prontuario.create.mockResolvedValue(
        prontuarioCriado,
      );

      const resultado = await service.criar(dto);

      expect(
        prismaMock.prontuario.create,
      ).toHaveBeenCalledWith({
        data: {
          paciente: 'Maria Silva',
          medico: 'Dr. Carlos',
          data: new Date('2026-11-18T00:00:00.000Z'),
          tipo: 'Consulta de rotina',
          observacoes: 'Atendimento ficticio',
        },
      });

      expect(resultado).toEqual(prontuarioCriado);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar o status de um prontuario existente', async () => {
      const prontuarioExistente = {
        id: 1,
        paciente: 'Maria Silva',
        status: 'EM_ANALISE',
      };

      const prontuarioAtualizado = {
        ...prontuarioExistente,
        status: 'FINALIZADO',
      };

      prismaMock.prontuario.findUnique.mockResolvedValue(
        prontuarioExistente,
      );

      prismaMock.prontuario.update.mockResolvedValue(
        prontuarioAtualizado,
      );

      const resultado = await service.atualizar(1, {
        status: 'FINALIZADO',
      });

      expect(
        prismaMock.prontuario.update,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'FINALIZADO',
        }),
      });

      expect(resultado).toEqual(prontuarioAtualizado);
    });

    it('deve rejeitar uma atualizacao sem campos', async () => {
      await expect(
        service.atualizar(1, {}),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.prontuario.update,
      ).not.toHaveBeenCalled();
    });

    it('deve rejeitar a atualizacao de um prontuario inexistente', async () => {
      prismaMock.prontuario.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.atualizar(999, {
          status: 'FINALIZADO',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaMock.prontuario.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('deve listar todos os prontuarios sem filtros', async () => {
      const prontuarios = [
        { id: 1, paciente: 'Maria Silva' },
        { id: 2, paciente: 'Joao Santos' },
      ];

      prismaMock.prontuario.findMany.mockResolvedValue(
        prontuarios,
      );

      const resultado = await service.listar({});

      expect(resultado).toEqual(prontuarios);

      expect(
        prismaMock.prontuario.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          data: 'desc',
        },
      });
    });

    it('deve pesquisar por paciente, medico ou tipo', async () => {
      prismaMock.prontuario.findMany.mockResolvedValue([]);

      await service.listar({
        q: '  Maria  ',
      });

      expect(
        prismaMock.prontuario.findMany,
      ).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              paciente: {
                contains: 'Maria',
                mode: 'insensitive',
              },
            },
            {
              medico: {
                contains: 'Maria',
                mode: 'insensitive',
              },
            },
            {
              tipo: {
                contains: 'Maria',
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          data: 'desc',
        },
      });
    });

    it('deve filtrar prontuarios por status', async () => {
      prismaMock.prontuario.findMany.mockResolvedValue([]);

      await service.listar({
        status: 'FINALIZADO',
      });

      expect(
        prismaMock.prontuario.findMany,
      ).toHaveBeenCalledWith({
        where: {
          status: 'FINALIZADO',
        },
        orderBy: {
          data: 'desc',
        },
      });
    });
  });
});
