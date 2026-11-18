
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProntuarioDto } from './dto/create-prontuario.dto.js';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto.js';
import { ListarProntuariosDto } from './dto/listar-prontuarios.dto.js';

@Injectable()
export class ProntuariosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar(filtros: ListarProntuariosDto) {
    const busca = filtros.q?.trim();

    return this.prisma.prontuario.findMany({
      where: {
        ...(busca
          ? {
              OR: [
                {
                  paciente: {
                    contains: busca,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  medico: {
                    contains: busca,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  tipo: {
                    contains: busca,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
        ...(filtros.status
          ? { status: filtros.status }
          : {}),
      },
      orderBy: {
        data: 'desc',
      },
    });
  }

  async obterEstatisticas() {
    const grupos = await this.prisma.prontuario.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const emAnalise =
      grupos.find(
        (grupo) => grupo.status === 'EM_ANALISE',
      )?._count._all ?? 0;

    const finalizados =
      grupos.find(
        (grupo) => grupo.status === 'FINALIZADO',
      )?._count._all ?? 0;

    return {
      total: emAnalise + finalizados,
      finalizados,
      emAnalise,
    };
  }

  async buscarPorId(id: number) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
    });

    if (!prontuario) {
      throw new NotFoundException(
        `Prontuário com ID ${id} não encontrado.`,
      );
    }

    return prontuario;
  }

  async criar(dto: CreateProntuarioDto) {
    return this.prisma.prontuario.create({
      data: {
        paciente: dto.paciente.trim(),
        medico: dto.medico.trim(),
        data: new Date(`${dto.data}T00:00:00.000Z`),
        tipo: dto.tipo.trim(),
        observacoes: dto.observacoes.trim(),
      },
    });
  }

  async atualizar(id: number, dto: UpdateProntuarioDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Informe ao menos um campo para atualizar.',
      );
    }

    await this.buscarPorId(id);

    return this.prisma.prontuario.update({
      where: { id },
      data: {
        paciente: dto.paciente?.trim(),
        medico: dto.medico?.trim(),
        data: dto.data
          ? new Date(`${dto.data}T00:00:00.000Z`)
          : undefined,
        tipo: dto.tipo?.trim(),
        observacoes: dto.observacoes?.trim(),
        status: dto.status,
      },
    });
  }
}
