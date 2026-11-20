import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";

import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { CriarAgendamentoDto } from "./dto/criar-agendamento.dto.js";

@Injectable()
export class AgendamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: {
    pacienteId?: string;
    agendaId?: string;
    status?: string;
  }) {
    return this.prisma.agendamento.findMany({
      where: {
        ...(filtros.pacienteId && {
          pacienteId: filtros.pacienteId,
        }),
        ...(filtros.agendaId && {
          agendaId: filtros.agendaId,
        }),
        ...(filtros.status && {
          status: filtros.status,
        }),
      },
      orderBy: {
        inicio: "asc",
      },
    });
  }

  async buscarPorId(id: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      throw new NotFoundException("Agendamento não encontrado.");
    }

    return agendamento;
  }

  async criar(dto: CriarAgendamentoDto) {
    const inicio = new Date(dto.inicio);
    const fim = new Date(dto.fim);

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fim.getTime()) ||
      inicio >= fim
    ) {
      throw new BadRequestException("O período informado é inválido.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Bloqueia a agenda até o término da transação.
      const agendas = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM agd_agenda
        WHERE id = ${dto.agendaId}
        FOR UPDATE
      `;

      if (agendas.length === 0) {
        throw new NotFoundException("Agenda não encontrada.");
      }

      const agenda = await tx.agenda.findUnique({
        where: { id: dto.agendaId },
      });

      if (!agenda || !agenda.ativa) {
        throw new NotFoundException("Agenda não encontrada ou inativa.");
      }

      // Verifica se o horário está disponível.
      const disponibilidade = await tx.disponibilidade.findFirst({
        where: {
          agendaId: dto.agendaId,
          unidadeId: dto.unidadeId,
          servicoId: dto.servicoId,
          inicio: { lte: inicio },
          fim: { gte: fim },
        },
      });

      if (!disponibilidade) {
        throw new ConflictException(
          "Horário fora da disponibilidade da agenda.",
        );
      }

      // Verifica se existe bloqueio no período.
      const bloqueio = await tx.bloqueio.findFirst({
        where: {
          agendaId: dto.agendaId,
          inicio: { lt: fim },
          fim: { gt: inicio },
        },
      });

      if (bloqueio) {
        throw new ConflictException("Horário bloqueado.");
      }

      // Verifica conflitos com outros agendamentos.
      const conflito = await tx.agendamento.findFirst({
        where: {
          agendaId: dto.agendaId,
          status: { not: "CANCELADO" },
          inicio: { lt: fim },
          fim: { gt: inicio },
        },
      });

      if (conflito) {
        throw new ConflictException("Já existe um agendamento nesse horário.");
      }

      // Cria o agendamento dentro da mesma transação.
      return tx.agendamento.create({
        data: {
          id: randomUUID(),
          agendaId: dto.agendaId,
          pacienteId: dto.pacienteId,
          unidadeId: dto.unidadeId,
          servicoId: dto.servicoId,
          inicio,
          fim,
          status: "AGENDADO",
        },
      });
    });
  }

  async cancelar(id: string) {
    // Busca inicialmente o agendamento para identificar sua agenda.
    const existente = await this.prisma.agendamento.findUnique({
      where: { id },
    });

    if (!existente) {
      throw new NotFoundException("Agendamento não encontrado.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Bloqueia a agenda para sincronizar o cancelamento
      // com as operações de criação de agendamentos e bloqueios.
      const agendas = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM agd_agenda
        WHERE id = ${existente.agendaId}
        FOR UPDATE
      `;

      if (agendas.length === 0) {
        throw new NotFoundException("Agenda não encontrada.");
      }

      // Consulta novamente após adquirir o bloqueio.
      const agendamento = await tx.agendamento.findUnique({
        where: { id },
      });

      if (!agendamento) {
        throw new NotFoundException("Agendamento não encontrado.");
      }

      if (agendamento.status === "CANCELADO") {
        throw new BadRequestException("Este agendamento já está cancelado.");
      }

      // Atualiza o status dentro da transação.
      return tx.agendamento.update({
        where: { id },
        data: {
          status: "CANCELADO",
        },
      });
    });
  }
}
