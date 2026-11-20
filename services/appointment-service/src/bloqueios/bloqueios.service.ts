
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarBloqueioDto } from './dto/criar-bloqueio.dto.js';


@Injectable()
export class BloqueiosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar(agendaId?: string) {
    return this.prisma.bloqueio.findMany({
      where: {
        ...(agendaId && { agendaId }),
      },
      orderBy: {
        inicio: 'asc',
      },
    });
  }

  async buscarPorId(id: string) {
    const bloqueio =
      await this.prisma.bloqueio.findUnique({
        where: { id },
      });

    if (!bloqueio) {
      throw new NotFoundException(
        'Bloqueio não encontrado.',
      );
    }

    return bloqueio;
  }

  async criar(dto: CriarBloqueioDto) {
    const inicio = new Date(dto.inicio);
    const fim = new Date(dto.fim);

    // Valida o período informado.
    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fim.getTime()) ||
      inicio >= fim
    ) {
      throw new BadRequestException(
        'O período informado é inválido.',
      );
    }

    // Executa todas as verificações e a criação
    // dentro da mesma transação.
    return this.prisma.$transaction(async (tx) => {
      // Bloqueia a linha da agenda para sincronizar
      // operações de agendamento e bloqueio.
      const agendas = await tx.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT id
        FROM agd_agenda
        WHERE id = ${dto.agendaId}
        FOR UPDATE
      `;

      if (agendas.length === 0) {
        throw new NotFoundException(
          'Agenda não encontrada.',
        );
      }

      const agenda = await tx.agenda.findUnique({
        where: { id: dto.agendaId },
      });

      if (!agenda || !agenda.ativa) {
        throw new NotFoundException(
          'Agenda não encontrada ou inativa.',
        );
      }

      // Verifica conflitos com outros bloqueios.
      const conflito = await tx.bloqueio.findFirst({
        where: {
          agendaId: dto.agendaId,
          inicio: { lt: fim },
          fim: { gt: inicio },
        },
      });

      if (conflito) {
        throw new ConflictException(
          'Já existe um bloqueio nesse período.',
        );
      }

      // Verifica se existem agendamentos no período.
      const agendamentoExistente =
        await tx.agendamento.findFirst({
          where: {
            agendaId: dto.agendaId,
            status: { not: 'CANCELADO' },
            inicio: { lt: fim },
            fim: { gt: inicio },
          },
        });

      if (agendamentoExistente) {
        throw new ConflictException(
          'Não é possível bloquear um horário que possui agendamento.',
        );
      }

      // Cria o bloqueio dentro da transação.
      return tx.bloqueio.create({
        data: {
          id: randomUUID(),
          agendaId: dto.agendaId,
          inicio,
          fim,
          motivo: dto.motivo,
        },
      });
    });
  }
}
