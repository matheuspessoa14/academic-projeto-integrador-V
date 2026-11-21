import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AgendasService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar(filtros: {
    clinicaId?: string;
    profissionalId?: string;
    tenantId?: string;
  }) {
    return this.prisma.agenda.findMany({
      where: {
        ...(filtros.clinicaId && {
          clinicaId: filtros.clinicaId,
        }),
        ...(filtros.tenantId && { clinicaId: filtros.tenantId }),
        ...(filtros.profissionalId && {
          profissionalId: filtros.profissionalId,
        }),
      },
      orderBy: {
        profissionalId: 'asc',
      },
    });
  }

  async buscarPorId(id: string, tenantId?: string) {
    const agenda = tenantId
      ? await this.prisma.agenda.findFirst({
          where: { id, clinicaId: tenantId },
          include: { disponibilidades: true, bloqueios: true },
        })
      : await this.prisma.agenda.findUnique({
      where: { id },
      include: {
        disponibilidades: true,
        bloqueios: true,
      },
    });

    if (!agenda) {
      throw new NotFoundException(
        'Agenda não encontrada.',
      );
    }

    return agenda;
  }
}
