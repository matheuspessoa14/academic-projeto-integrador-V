
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { CriarDisponibilidadeDto } from './dto/criar-disponibilidade.dto.js';

@Injectable()
export class DisponibilidadesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar(filtros: {
    agendaId?: string;
    unidadeId?: string;
    servicoId?: string;
    tenantId?: string;
  }) {
    return this.prisma.disponibilidade.findMany({
      where: {
        ...(filtros.tenantId && { agenda: { clinicaId: filtros.tenantId } }),
        ...(filtros.agendaId && {
          agendaId: filtros.agendaId,
        }),
        ...(filtros.unidadeId && {
          unidadeId: filtros.unidadeId,
        }),
        ...(filtros.servicoId && {
          servicoId: filtros.servicoId,
        }),
      },
      orderBy: {
        inicio: 'asc',
      },
    });
  }

  async buscarPorId(id: string, tenantId?: string) {
    const disponibilidade = tenantId
      ? await this.prisma.disponibilidade.findFirst({ where: { id, agenda: { clinicaId: tenantId } } })
      : await this.prisma.disponibilidade.findUnique({ where: { id } });

    if (!disponibilidade) {
      throw new NotFoundException(
        'Disponibilidade não encontrada.',
      );
    }

    return disponibilidade;
  }

  async criar(dto: CriarDisponibilidadeDto, tenantId?: string) {
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

    // Executa as validações e a criação
    // dentro de uma única transação.
    return this.prisma.$transaction(async (tx) => {
      // Bloqueia a agenda para sincronizar
      // a criação de disponibilidades com outras operações.
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

      // Verifica se a agenda está ativa.
      const agenda = await tx.agenda.findUnique({
        where: { id: dto.agendaId },
      });

      if (!agenda || !agenda.ativa) {
        throw new NotFoundException(
          'Agenda não encontrada ou inativa.',
        );
      }

      if (tenantId && agenda.clinicaId !== tenantId) {
        throw new NotFoundException("Agenda não encontrada nesta clínica.");
      }

      // Verifica sobreposição para a mesma
      // agenda, unidade e serviço.
      const conflito =
        await tx.disponibilidade.findFirst({
          where: {
            agendaId: dto.agendaId,
            unidadeId: dto.unidadeId,
            servicoId: dto.servicoId,
            inicio: { lt: fim },
            fim: { gt: inicio },
          },
        });

      if (conflito) {
        throw new ConflictException(
          'Já existe uma disponibilidade nesse período para esta agenda, unidade e serviço.',
        );
      }

      // Cria a disponibilidade dentro da transação.
      return tx.disponibilidade.create({
        data: {
          id: randomUUID(),
          agendaId: dto.agendaId,
          unidadeId: dto.unidadeId,
          servicoId: dto.servicoId,
          inicio,
          fim,
        },
      });
    });
  }
}
